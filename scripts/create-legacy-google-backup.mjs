#!/usr/bin/env node

import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

import { getServiceAccountAccessToken } from "../apps/frontend/nis-boutique-catering/scripts/content-utils.mjs";

const root = resolve(import.meta.dirname, "..");
const sheetId = process.env.GOOGLE_SHEET_ID;
const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
const timestamp = process.env.BACKUP_TIMESTAMP;
const outputRoot = resolve(process.argv[2] ?? join(root, "backups/legacy-google"));
if (!sheetId || !driveFolderId || !timestamp || !/^\d{8}T\d{6}Z$/u.test(timestamp)) {
  throw new Error("GOOGLE_SHEET_ID, GOOGLE_DRIVE_FOLDER_ID and BACKUP_TIMESTAMP=YYYYMMDDTHHMMSSZ are required.");
}

const backupRoot = join(outputRoot, timestamp);
await mkdir(join(backupRoot, "drive-files"), { recursive: true });
const token = await getServiceAccountAccessToken();
if (!token) throw new Error("Read-only Google service account credentials are required.");

const googleJson = async (url) => {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Google read failed (${response.status}) for ${new URL(url).pathname}`);
  return response.json();
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => `${JSON.stringify(value)}\n`;

const spreadsheet = await googleJson(
  `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=spreadsheetId,properties(title,locale,timeZone),sheets(properties(sheetId,title,index,gridProperties))`,
);
const sheets = [];
for (const sheet of spreadsheet.sheets.sort((a, b) => a.properties.index - b.properties.index)) {
  const title = sheet.properties.title;
  const values = (await googleJson(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(`'${title}'`)}`,
  )).values ?? [];
  const headers = values[0] ?? [];
  const keyIndex = Math.max(headers.indexOf("id"), headers.indexOf("key"));
  sheets.push({
    properties: sheet.properties,
    rows: values.map((row, index) => {
      const stableKey = index === 0 ? "headers" : (keyIndex >= 0 && row[keyIndex]) || `row-${index + 1}`;
      return {
        rowNumber: index + 1,
        sha256: sha256(canonical(row)),
        stableId: `${sheet.properties.sheetId}:${stableKey}`,
        values: row,
      };
    }),
  });
}
await writeFile(join(backupRoot, "sheets-export.json"), canonical({
  backedUpAt: timestamp,
  properties: spreadsheet.properties,
  sheetId,
  sheets,
}));

const driveFields = "nextPageToken,files(id,name,mimeType,size,md5Checksum,imageMediaMetadata,modifiedTime,parents)";
const driveFiles = [];
let pageToken = "";
do {
  const params = new URLSearchParams({
    fields: driveFields,
    pageSize: "1000",
    q: `'${driveFolderId}' in parents and trashed = false`,
  });
  if (pageToken) params.set("pageToken", pageToken);
  const page = await googleJson(`https://www.googleapis.com/drive/v3/files?${params}`);
  driveFiles.push(...page.files);
  pageToken = page.nextPageToken ?? "";
} while (pageToken);

const generatedPath = join(root, "apps/frontend/nis-boutique-catering/src/generated/siteContent.generated.json");
const generated = JSON.parse(await readFile(generatedPath, "utf8"));
const referencedIds = new Set(generated.media.flatMap((media) => media.driveFileId ? [media.driveFileId] : []));
for (const id of referencedIds) {
  if (!driveFiles.some((file) => file.id === id)) {
    driveFiles.push(await googleJson(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,size,md5Checksum,imageMediaMetadata,modifiedTime,parents`));
  }
}
driveFiles.sort((a, b) => a.id.localeCompare(b.id));

const mimeExtensions = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"], ["image/avif", ".avif"]]);
const driveManifest = [];
for (const file of driveFiles) {
  if (file.mimeType.startsWith("application/vnd.google-apps.")) {
    throw new Error(`Native Google file ${file.id} requires an explicit export format.`);
  }
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Drive download failed (${response.status}) for ${file.id}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const extension = mimeExtensions.get(file.mimeType) ?? extname(file.name).toLowerCase();
  const storedPath = `drive-files/${file.id}${extension}`;
  await writeFile(join(backupRoot, storedPath), bytes);
  driveManifest.push({ ...file, sha256: sha256(bytes), storedPath });
}
await writeFile(join(backupRoot, "drive-manifest.json"), canonical({ driveFolderId, files: driveManifest }));
await copyFile(generatedPath, join(backupRoot, "generated-snapshot.json"));

const listFiles = async (directory) => (await readdir(directory, { withFileTypes: true })).flatMap((entry) =>
  entry.isDirectory() ? [] : [join(directory, entry.name)]
);
const paths = [
  ...(await listFiles(backupRoot)),
  ...(await listFiles(join(backupRoot, "drive-files"))),
].filter((path) => !path.endsWith("manifest.json") || path.endsWith("drive-manifest.json"));
const files = [];
for (const path of paths.sort()) {
  const bytes = await readFile(path);
  files.push({ path: relative(backupRoot, path), sha256: sha256(bytes), size: bytes.length });
}
await writeFile(join(backupRoot, "backup-manifest.json"), canonical({
  backedUpAt: timestamp,
  counts: {
    driveFiles: driveManifest.length,
    sheetRows: sheets.reduce((total, sheet) => total + sheet.rows.length, 0),
    sheets: sheets.length,
  },
  files,
  formatVersion: 1,
  source: { driveFolderId, sheetId },
}));
console.log(JSON.stringify({ backupRoot, driveFiles: driveManifest.length, sheetRows: sheets.reduce((total, sheet) => total + sheet.rows.length, 0), sheets: sheets.length }));
