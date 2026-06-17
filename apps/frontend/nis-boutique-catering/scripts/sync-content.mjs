import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  clearCmsMedia,
  cmsSourceRoot,
  extensionForMimeType,
  fallbackPath,
  getServiceAccountAccessToken,
  optimizeCmsMedia,
  pathFromPublicSrc,
  readJson,
  validateContentShape,
  writeGeneratedSnapshot,
} from './content-utils.mjs';

const sheetsBaseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
const driveBaseUrl = 'https://www.googleapis.com/drive/v3';

const sheetId = process.env.GOOGLE_SHEET_ID || process.env.VITE_GOOGLE_SHEET_ID;
const requireRemote = process.env.CONTENT_SYNC_REQUIRE_REMOTE === 'true';

const rowsToObjects = (rows) => {
  const [headers = [], ...body] = rows;
  return body
    .filter((row) => row.some(Boolean))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
};

const parseBool = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['true', '1', 'yes', 'כן'].includes(normalized)) return true;
  if (['false', '0', 'no', 'לא'].includes(normalized)) return false;
  return fallback;
};

const fetchSheetValues = async (accessToken, range) => {
  const response = await fetch(`${sheetsBaseUrl}/${sheetId}/values/${encodeURIComponent(range)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Could not read ${range}`);
  }

  const data = await response.json();
  return data.values ?? [];
};

const readRemoteSnapshot = async (accessToken) => {
  const [settingsRows, mediaRows, galleryRows, servicesRows, sectionsRows] = await Promise.all([
    fetchSheetValues(accessToken, 'site_settings!A:B'),
    fetchSheetValues(accessToken, 'media!A:H'),
    fetchSheetValues(accessToken, 'gallery!A:J'),
    fetchSheetValues(accessToken, 'services!A:I'),
    fetchSheetValues(accessToken, 'sections!A:F'),
  ]);
  const settings = Object.fromEntries(settingsRows.filter((row) => row[0]).map(([key, value]) => [key, value ?? '']));

  return {
    version: settings.version || String(Date.now()),
    updatedAt: new Date().toISOString(),
    settings: {
      phoneDisplay: settings.phoneDisplay,
      phoneHref: settings.phoneHref,
      email: settings.email,
      whatsappBase: settings.whatsappBase,
      siteVersion: settings.siteVersion,
      seoTitle: settings.seoTitle || undefined,
      seoDescription: settings.seoDescription || undefined,
    },
    media: rowsToObjects(mediaRows).map((row) => ({
      id: row.id,
      src: row.src,
      width: Number(row.width),
      height: Number(row.height),
      sizes: row.sizes || undefined,
      responsive: parseBool(row.responsive, true),
      driveFileId: row.driveFileId || undefined,
      usageNotes: row.usageNotes || undefined,
    })),
    gallery: rowsToObjects(galleryRows).map((row) => ({
      id: row.id,
      title: row.title,
      alt: row.alt,
      category: row.category,
      order: Number(row.order),
      active: parseBool(row.active, true),
      tall: parseBool(row.tall),
      mediaId: row.mediaId,
      driveFileId: row.driveFileId || undefined,
    })),
    services: rowsToObjects(servicesRows).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      bestFor: row.bestFor,
      promise: row.promise,
      details: String(row.details ?? '').split('|').map((item) => item.trim()).filter(Boolean),
      cta: row.cta,
      mediaId: row.mediaId,
      icon: row.icon,
    })),
    sections: rowsToObjects(sectionsRows).map((row) => ({
      id: row.id,
      group: row.group,
      title: row.title || undefined,
      text: row.text || undefined,
      items: String(row.items ?? '').split('|').map((item) => item.trim()).filter(Boolean),
      active: parseBool(row.active, true),
    })),
  };
};

const downloadDriveMedia = async (accessToken, media) => {
  if (!media.driveFileId || !media.src.startsWith('/media/cms/')) {
    return;
  }

  const metadataResponse = await fetch(`${driveBaseUrl}/files/${media.driveFileId}?fields=id,name,mimeType,imageMediaMetadata`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!metadataResponse.ok) {
    throw new Error(`Could not read Drive metadata for ${media.id}`);
  }
  const metadata = await metadataResponse.json();
  const mediaResponse = await fetch(`${driveBaseUrl}/files/${media.driveFileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!mediaResponse.ok) {
    throw new Error(`Could not download Drive media for ${media.id}`);
  }

  const sourcePath = `${cmsSourceRoot}/${media.id}${extensionForMimeType(metadata.mimeType)}`;
  mkdirSync(dirname(sourcePath), { recursive: true });
  writeFileSync(sourcePath, Buffer.from(await mediaResponse.arrayBuffer()));

  if (!media.width && metadata.imageMediaMetadata?.width) {
    media.width = Number(metadata.imageMediaMetadata.width);
  }
  if (!media.height && metadata.imageMediaMetadata?.height) {
    media.height = Number(metadata.imageMediaMetadata.height);
  }
  if (!media.src.match(/\.[^.]+$/)) {
    media.src = `${media.src}.webp`;
  }

  optimizeCmsMedia(media, sourcePath);
};

const accessToken = await getServiceAccountAccessToken();

if (requireRemote && (!accessToken || !sheetId)) {
  throw new Error('Remote content sync is required, but GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SHEET_ID is missing.');
}

const snapshot = accessToken && sheetId ? await readRemoteSnapshot(accessToken) : readJson(fallbackPath);

const errors = validateContentShape(snapshot);
if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

if (accessToken) {
  clearCmsMedia();
  for (const media of snapshot.media) {
    await downloadDriveMedia(accessToken, media);
  }
}

writeGeneratedSnapshot(snapshot);
console.log(accessToken ? 'Synced content from Google Sheets + Drive.' : 'Generated content from committed fallback.');
