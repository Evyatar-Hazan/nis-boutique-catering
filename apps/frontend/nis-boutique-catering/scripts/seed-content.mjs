import { readJson, fallbackPath, getServiceAccountAccessToken, validateContentShape } from './content-utils.mjs';

const sheetsBaseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
const sheetId = process.env.GOOGLE_SHEET_ID || process.env.VITE_GOOGLE_SHEET_ID;
const writeScope = 'https://www.googleapis.com/auth/spreadsheets';

if (!sheetId) {
  throw new Error('GOOGLE_SHEET_ID or VITE_GOOGLE_SHEET_ID is required.');
}

const accessToken = await getServiceAccountAccessToken(writeScope);

if (!accessToken) {
  throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is required.');
}

const serviceAccountEmail = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON).client_email;
console.log(`Seeding with service account: ${serviceAccountEmail}`);

const normalizeForCms = (snapshot) => ({
  ...snapshot,
  version: `seed-${new Date().toISOString()}`,
  updatedAt: new Date().toISOString(),
  media: snapshot.media.map((media) => ({
    ...media,
    src: media.driveFileId ? `/media/cms/${media.id}.webp` : media.src,
    responsive: media.responsive ?? true,
  })),
  gallery: snapshot.gallery.map((item, index) => ({
    ...item,
    order: index + 1,
    driveFileId: undefined,
  })),
});

const snapshot = normalizeForCms(readJson(fallbackPath));
const errors = validateContentShape(snapshot);

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const requestSheets = async (path, init) => {
  const response = await fetch(`${sheetsBaseUrl}/${sheetId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Google Sheets request failed: ${path}\n${body}`);
  }

  return response.json().catch(() => null);
};

const putSheetValues = (range, values) =>
  requestSheets(`/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: JSON.stringify({ values }),
  });

await requestSheets('/values:batchClear', {
  method: 'POST',
  body: JSON.stringify({
    ranges: ['site_settings!A:B', 'media!A:H', 'gallery!A:J', 'services!A:J', 'sections!A:F'],
  }),
});

await Promise.all([
  putSheetValues('site_settings!A:B', [
    ['key', 'value'],
    ['version', snapshot.version],
    ['phoneDisplay', snapshot.settings.phoneDisplay],
    ['phoneHref', snapshot.settings.phoneHref],
    ['email', snapshot.settings.email],
    ['whatsappBase', snapshot.settings.whatsappBase],
    ['siteVersion', snapshot.settings.siteVersion],
    ['seoTitle', snapshot.settings.seoTitle ?? ''],
    ['seoDescription', snapshot.settings.seoDescription ?? ''],
  ]),
  putSheetValues('media!A:H', [
    ['id', 'src', 'width', 'height', 'sizes', 'responsive', 'driveFileId', 'usageNotes'],
    ...snapshot.media.map((item) => [
      item.id,
      item.src,
      item.width,
      item.height,
      item.sizes ?? '',
      item.responsive,
      item.driveFileId ?? '',
      item.usageNotes ?? '',
    ]),
  ]),
  putSheetValues('gallery!A:J', [
    ['id', 'title', 'alt', 'category', 'order', 'active', 'tall', 'mediaId', 'driveFileId', 'notes'],
    ...snapshot.gallery.map((item) => [
      item.id,
      item.title,
      item.alt,
      item.category,
      item.order,
      item.active,
      item.tall,
      item.mediaId,
      item.driveFileId ?? '',
      '',
    ]),
  ]),
  putSheetValues('services!A:J', [
    ['id', 'title', 'subtitle', 'description', 'bestFor', 'promise', 'details', 'cta', 'mediaId', 'icon'],
    ...snapshot.services.map((item) => [
      item.id,
      item.title,
      item.subtitle,
      item.description,
      item.bestFor,
      item.promise,
      item.details.join('|'),
      item.cta,
      item.mediaId,
      item.icon,
    ]),
  ]),
  putSheetValues('sections!A:F', [
    ['id', 'group', 'title', 'text', 'items', 'active'],
    ...snapshot.sections.map((item) => [
      item.id,
      item.group,
      item.title ?? '',
      item.text ?? '',
      item.items.join('|'),
      item.active,
    ]),
  ]),
]);

console.log(`Seeded ${sheetId} with ${snapshot.media.length} media rows, ${snapshot.gallery.length} gallery rows, ${snapshot.services.length} services, and ${snapshot.sections.length} sections.`);
