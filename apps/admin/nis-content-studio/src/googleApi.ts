import { contentSnapshotSchema, parseBoolean, type ContentSnapshot, type GalleryItemRecord, type ImageAssetRecord, type ServiceRecord } from '@monorepo/content-schema';
import { googleScopes, studioConfig } from './config';
import {
  getConfiguredStudioAdmins,
  parseStudioAdmins,
  serializeStudioAdmins,
  type StudioAdminRecord,
} from './studioAdmins';

const sheetsBaseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
const driveBaseUrl = 'https://www.googleapis.com/drive/v3';
const defaultAccessTokenTtlMs = 50 * 60 * 1000;
const tokenExpirySafetyMs = 2 * 60 * 1000;
const retryableGoogleStatuses = new Set([408, 429, 500, 502, 503, 504]);
const googleRequestRetryDelaysMs = [350, 1_000, 2_000];

export interface GoogleAccessToken {
  readonly accessToken: string;
  readonly expiresAt: number;
}

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
    document.head.append(script);
  });

const wait = (durationMs: number) => new Promise((resolve) => {
  window.setTimeout(resolve, durationMs);
});

const fetchGoogleApi = async (url: string, init: RequestInit, label: string) => {
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= googleRequestRetryDelaysMs.length; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      lastError = error;
      if (attempt >= googleRequestRetryDelaysMs.length) {
        break;
      }

      await wait(googleRequestRetryDelaysMs[attempt]);
      continue;
    }

    if (response.ok) {
      return response;
    }

    lastResponse = response;
    const canRetry = retryableGoogleStatuses.has(response.status) && attempt < googleRequestRetryDelaysMs.length;
    if (!canRetry) {
      break;
    }

    await wait(googleRequestRetryDelaysMs[attempt]);
  }

  if (lastError instanceof Error) {
    throw new Error(`${label} (${lastError.message})`);
  }

  throw new Error(`${label} (${lastResponse?.status ?? 'network error'})`);
};

export const requestGoogleAccessToken = async (options: { readonly prompt?: 'consent' | '' } = {}): Promise<GoogleAccessToken> => {
  if (!studioConfig.clientId) {
    throw new Error('Missing VITE_GOOGLE_CLIENT_ID');
  }

  await loadScript('https://accounts.google.com/gsi/client');

  return new Promise<GoogleAccessToken>((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: studioConfig.clientId,
      scope: googleScopes,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error ?? 'Google login failed'));
          return;
        }
        const expiresInSeconds = Number(response.expires_in);
        const ttl = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0 ? expiresInSeconds * 1000 : defaultAccessTokenTtlMs;
        resolve({
          accessToken: response.access_token,
          expiresAt: Date.now() + Math.max(60_000, ttl - tokenExpirySafetyMs),
        });
      },
    });

    if (!tokenClient) {
      reject(new Error('Google Identity Services did not initialize'));
      return;
    }

    tokenClient.requestAccessToken({ prompt: options.prompt ?? 'consent' });
  });
};

export const fetchGoogleUserEmail = async (accessToken: string) => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Could not read Google user profile');
  }

  const profile = (await response.json()) as { email?: string };
  return profile.email?.toLowerCase() ?? '';
};

const fetchSheetRanges = async (accessToken: string, ranges: readonly string[]) => {
  const params = new URLSearchParams();
  ranges.forEach((range) => params.append('ranges', range));
  const url = `${sheetsBaseUrl}/${studioConfig.sheetId}/values:batchGet?${params.toString()}`;
  const response = await fetchGoogleApi(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }, 'Could not read Google Sheets content');

  const data = (await response.json()) as { valueRanges?: Array<{ values?: string[][] }> };
  return ranges.map((_, index) => data.valueRanges?.[index]?.values ?? []);
};

const fetchSpreadsheetSheetTitles = async (accessToken: string) => {
  const url = `${sheetsBaseUrl}/${studioConfig.sheetId}?fields=sheets.properties.title`;
  const response = await fetchGoogleApi(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }, 'Could not read Google Sheets metadata');
  const data = (await response.json()) as { sheets?: Array<{ properties?: { title?: string } }> };
  return new Set(data.sheets?.map((sheet) => sheet.properties?.title).filter((title): title is string => Boolean(title)) ?? []);
};

const ensureSheetExists = async (accessToken: string, title: string) => {
  const titles = await fetchSpreadsheetSheetTitles(accessToken);
  if (titles.has(title)) {
    return;
  }

  const url = `${sheetsBaseUrl}/${studioConfig.sheetId}:batchUpdate`;
  await fetchGoogleApi(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: { title },
          },
        },
      ],
    }),
  }, `Could not create ${title} sheet`);
};

const rowsToObjects = (rows: string[][]) => {
  const [headers = [], ...body] = rows;
  return body
    .filter((row) => row.some(Boolean))
    .map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])),
    ) as Record<string, string>[];
};

const numberOrFallback = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const readContentFromSheets = async (accessToken: string): Promise<ContentSnapshot> => {
  const [settingsRows, mediaRows, galleryRows, servicesRows, sectionsRows] = await fetchSheetRanges(accessToken, [
    'site_settings!A:B',
    'media!A:J',
    'gallery!A:K',
    'services!A:M',
    'sections!A:H',
  ]);

  const settings = Object.fromEntries(settingsRows.filter((row) => row[0]).map(([key, value]) => [key, value ?? '']));
  const media = rowsToObjects(mediaRows).map((row): ImageAssetRecord => ({
    id: row.id,
    title: row.title || undefined,
    src: row.src,
    width: Number(row.width),
    height: Number(row.height),
    sizes: row.sizes || undefined,
    responsive: parseBoolean(row.responsive, true),
    driveFileId: row.driveFileId || undefined,
    usageNotes: row.usageNotes || undefined,
    deletedAt: row.deletedAt || undefined,
  }));
  const gallery = rowsToObjects(galleryRows).map((row): GalleryItemRecord => ({
    id: row.id,
    title: row.title,
    alt: row.alt,
    category: row.category as GalleryItemRecord['category'],
    order: Number(row.order),
    active: parseBoolean(row.active, true),
    tall: parseBoolean(row.tall),
    mediaId: row.mediaId,
    driveFileId: row.driveFileId || undefined,
    deletedAt: row.deletedAt || undefined,
  }));
  const services = rowsToObjects(servicesRows).map((row, index): ServiceRecord => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    bestFor: row.bestFor,
    promise: row.promise,
    details: row.details.split('|').map((item) => item.trim()).filter(Boolean),
    cta: row.cta,
    mediaId: row.mediaId,
    icon: row.icon,
    active: parseBoolean(row.active, true),
    order: numberOrFallback(row.order || undefined, index + 1),
    deletedAt: row.deletedAt || undefined,
  }));
  const sections = rowsToObjects(sectionsRows).map((row, index) => ({
    id: row.id,
    group: row.group,
    title: row.title || undefined,
    text: row.text || undefined,
    items: row.items.split('|').map((item) => item.trim()).filter(Boolean),
    active: parseBoolean(row.active, true),
    order: numberOrFallback(row.order || undefined, index + 1),
    deletedAt: row.deletedAt || undefined,
  }));

  return contentSnapshotSchema.parse({
    version: settings.version || '1',
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
    media,
    gallery,
    services,
    sections,
  });
};

const putSheetValues = async (accessToken: string, range: string, values: readonly unknown[][]) => {
  const url = `${sheetsBaseUrl}/${studioConfig.sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  await fetchGoogleApi(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  }, `Could not write ${range}`);
};

export const saveContentToSheets = async (accessToken: string, snapshot: ContentSnapshot) => {
  const valid = contentSnapshotSchema.parse(snapshot);
  await Promise.all([
    putSheetValues(accessToken, 'site_settings!A:B', [
      ['key', 'value'],
      ['version', valid.version],
      ['phoneDisplay', valid.settings.phoneDisplay],
      ['phoneHref', valid.settings.phoneHref],
      ['email', valid.settings.email],
      ['whatsappBase', valid.settings.whatsappBase],
      ['siteVersion', valid.settings.siteVersion],
      ['seoTitle', valid.settings.seoTitle ?? ''],
      ['seoDescription', valid.settings.seoDescription ?? ''],
    ]),
    putSheetValues(accessToken, 'media!A:J', [
      ['id', 'title', 'src', 'width', 'height', 'sizes', 'responsive', 'driveFileId', 'usageNotes', 'deletedAt'],
      ...valid.media.map((item) => [item.id, item.title ?? '', item.src, item.width, item.height, item.sizes ?? '', item.responsive, item.driveFileId ?? '', item.usageNotes ?? '', item.deletedAt ?? '']),
    ]),
    putSheetValues(accessToken, 'gallery!A:K', [
      ['id', 'title', 'alt', 'category', 'order', 'active', 'tall', 'mediaId', 'driveFileId', 'notes', 'deletedAt'],
      ...valid.gallery.map((item) => [item.id, item.title, item.alt, item.category, item.order, item.active, item.tall, item.mediaId, item.driveFileId ?? '', '', item.deletedAt ?? '']),
    ]),
    putSheetValues(accessToken, 'services!A:M', [
      ['id', 'title', 'subtitle', 'description', 'bestFor', 'promise', 'details', 'cta', 'mediaId', 'icon', 'active', 'order', 'deletedAt'],
      ...valid.services.map((item) => [item.id, item.title, item.subtitle, item.description, item.bestFor, item.promise, item.details.join('|'), item.cta, item.mediaId, item.icon, item.active, item.order, item.deletedAt ?? '']),
    ]),
    putSheetValues(accessToken, 'sections!A:H', [
      ['id', 'group', 'title', 'text', 'items', 'active', 'order', 'deletedAt'],
      ...valid.sections.map((item) => [item.id, item.group, item.title ?? '', item.text ?? '', item.items.join('|'), item.active, item.order, item.deletedAt ?? '']),
    ]),
  ]);
};

export const readStudioAdminsFromSheets = async (accessToken: string): Promise<readonly StudioAdminRecord[]> => {
  try {
    const [adminRows] = await fetchSheetRanges(accessToken, ['admins!A:G']);
    const admins = parseStudioAdmins(adminRows);
    return admins.length > 0 ? admins : getConfiguredStudioAdmins();
  } catch {
    return getConfiguredStudioAdmins();
  }
};

export const saveStudioAdminsToSheets = async (accessToken: string, admins: readonly StudioAdminRecord[]) => {
  await ensureSheetExists(accessToken, 'admins');
  await putSheetValues(accessToken, 'admins!A:G', serializeStudioAdmins(admins));
};

export const uploadImageToDrive = async (accessToken: string, file: File) => {
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: studioConfig.driveFolderId ? [studioConfig.driveFolderId] : undefined,
  };
  const boundary = `nis-content-${crypto.randomUUID()}`;
  const body = new Blob(
    [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
      file,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` },
  );
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,imageMediaMetadata', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': body.type,
    },
    body,
  });

  if (!response.ok) {
    throw new Error('Could not upload image to Drive');
  }

  return (await response.json()) as { id: string; name: string; imageMediaMetadata?: { width?: number; height?: number } };
};

export const openDrivePicker = async (accessToken: string) => {
  if (!studioConfig.apiKey) {
    throw new Error('Missing VITE_GOOGLE_API_KEY for Google Picker');
  }

  await loadScript('https://apis.google.com/js/api.js');
  await new Promise<void>((resolve) => window.gapi?.load('picker', resolve));

  return new Promise<{ id: string; name: string }>((resolve, reject) => {
    if (!window.google?.picker) {
      reject(new Error('Google Picker did not initialize'));
      return;
    }

    const view = new window.google.picker.DocsView()
      .setIncludeFolders(false)
      .setSelectFolderEnabled(false)
      .setMimeTypes('image/png,image/jpeg,image/webp,image/avif');

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setOAuthToken(accessToken)
      .setDeveloperKey(studioConfig.apiKey)
      .setAppId(studioConfig.clientId)
      .setCallback((data) => {
        if (data.action === window.google?.picker?.Action.PICKED && data.docs?.[0]) {
          resolve({ id: data.docs[0].id, name: data.docs[0].name });
        }
      })
      .build();

    picker.setVisible(true);
  });
};

export const triggerPublish = async (accessToken: string) => {
  if (!studioConfig.publishUrl) {
    throw new Error('Missing VITE_GOOGLE_APPS_SCRIPT_PUBLISH_URL');
  }

  const response = await fetch(studioConfig.publishUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      accessToken,
      source: 'nis-content-studio',
      at: new Date().toISOString(),
    }),
  });

  const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? 'Publish hook failed');
  }
};

export const getDriveFileDownloadUrl = (fileId: string) => `${driveBaseUrl}/files/${fileId}?alt=media`;
