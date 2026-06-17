import { contentSnapshotSchema, parseBoolean, type ContentSnapshot, type GalleryItemRecord, type ImageAssetRecord, type ServiceRecord } from '@monorepo/content-schema';
import { googleScopes, studioConfig } from './config';

const sheetsBaseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
const driveBaseUrl = 'https://www.googleapis.com/drive/v3';

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

export const requestGoogleAccessToken = async () => {
  if (!studioConfig.clientId) {
    throw new Error('Missing VITE_GOOGLE_CLIENT_ID');
  }

  await loadScript('https://accounts.google.com/gsi/client');

  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: studioConfig.clientId,
      scope: googleScopes,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error ?? 'Google login failed'));
          return;
        }
        resolve(response.access_token);
      },
    });

    if (!tokenClient) {
      reject(new Error('Google Identity Services did not initialize'));
      return;
    }

    tokenClient.requestAccessToken({ prompt: 'consent' });
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

const fetchSheetValues = async (accessToken: string, range: string) => {
  const url = `${sheetsBaseUrl}/${studioConfig.sheetId}/values/${encodeURIComponent(range)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Could not read ${range}`);
  }

  const data = (await response.json()) as { values?: string[][] };
  return data.values ?? [];
};

const rowsToObjects = (rows: string[][]) => {
  const [headers = [], ...body] = rows;
  return body
    .filter((row) => row.some(Boolean))
    .map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])),
    ) as Record<string, string>[];
};

export const readContentFromSheets = async (accessToken: string): Promise<ContentSnapshot> => {
  const [settingsRows, mediaRows, galleryRows, servicesRows, sectionsRows] = await Promise.all([
    fetchSheetValues(accessToken, 'site_settings!A:B'),
    fetchSheetValues(accessToken, 'media!A:H'),
    fetchSheetValues(accessToken, 'gallery!A:J'),
    fetchSheetValues(accessToken, 'services!A:J'),
    fetchSheetValues(accessToken, 'sections!A:F'),
  ]);

  const settings = Object.fromEntries(settingsRows.filter((row) => row[0]).map(([key, value]) => [key, value ?? '']));
  const media = rowsToObjects(mediaRows).map((row): ImageAssetRecord => ({
    id: row.id,
    src: row.src,
    width: Number(row.width),
    height: Number(row.height),
    sizes: row.sizes || undefined,
    responsive: parseBoolean(row.responsive, true),
    driveFileId: row.driveFileId || undefined,
    usageNotes: row.usageNotes || undefined,
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
  }));
  const services = rowsToObjects(servicesRows).map((row): ServiceRecord => ({
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
  }));
  const sections = rowsToObjects(sectionsRows).map((row) => ({
    id: row.id,
    group: row.group,
    title: row.title || undefined,
    text: row.text || undefined,
    items: row.items.split('|').map((item) => item.trim()).filter(Boolean),
    active: parseBoolean(row.active, true),
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
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    throw new Error(`Could not write ${range}`);
  }
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
    putSheetValues(accessToken, 'media!A:H', [
      ['id', 'src', 'width', 'height', 'sizes', 'responsive', 'driveFileId', 'usageNotes'],
      ...valid.media.map((item) => [item.id, item.src, item.width, item.height, item.sizes ?? '', item.responsive, item.driveFileId ?? '', item.usageNotes ?? '']),
    ]),
    putSheetValues(accessToken, 'gallery!A:J', [
      ['id', 'title', 'alt', 'category', 'order', 'active', 'tall', 'mediaId', 'driveFileId', 'notes'],
      ...valid.gallery.map((item) => [item.id, item.title, item.alt, item.category, item.order, item.active, item.tall, item.mediaId, item.driveFileId ?? '', '']),
    ]),
    putSheetValues(accessToken, 'services!A:J', [
      ['id', 'title', 'subtitle', 'description', 'bestFor', 'promise', 'details', 'cta', 'mediaId', 'icon'],
      ...valid.services.map((item) => [item.id, item.title, item.subtitle, item.description, item.bestFor, item.promise, item.details.join('|'), item.cta, item.mediaId, item.icon]),
    ]),
    putSheetValues(accessToken, 'sections!A:F', [
      ['id', 'group', 'title', 'text', 'items', 'active'],
      ...valid.sections.map((item) => [item.id, item.group, item.title ?? '', item.text ?? '', item.items.join('|'), item.active]),
    ]),
  ]);
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
