import { createSign } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export const appRoot = resolve(import.meta.dirname, '..');
export const fallbackPath = resolve(appRoot, 'content/fallback-content.json');
export const generatedJsonPath = resolve(appRoot, 'src/generated/siteContent.generated.json');
export const generatedTsPath = resolve(appRoot, 'src/generated/siteContent.generated.ts');
export const publicRoot = resolve(appRoot, 'public');
export const cmsMediaRoot = resolve(publicRoot, 'media/cms');
export const cmsSourceRoot = resolve(cmsMediaRoot, '_source');

export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

export const writeGeneratedSnapshot = (snapshot) => {
  mkdirSync(dirname(generatedJsonPath), { recursive: true });
  const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
  writeFileSync(generatedJsonPath, serialized);
  writeFileSync(generatedTsPath, `export const contentSnapshot = ${JSON.stringify(snapshot, null, 2)} as const;\n`);
};

export const validateContentShape = (snapshot) => {
  const errors = [];
  const mediaIds = new Set();

  if (!snapshot.settings?.email?.includes('@')) {
    errors.push('settings.email must be a valid email-like value');
  }

  for (const media of snapshot.media ?? []) {
    if (media.deletedAt) {
      continue;
    }
    if (!media.id || !media.src || !media.width || !media.height) {
      errors.push(`media row is incomplete: ${JSON.stringify(media)}`);
    }
    if (mediaIds.has(media.id)) {
      errors.push(`duplicate media id: ${media.id}`);
    }
    mediaIds.add(media.id);
  }

  for (const item of snapshot.gallery ?? []) {
    if (item.deletedAt) {
      continue;
    }
    if (!item.id || !item.title || !item.alt || !item.mediaId) {
      errors.push(`gallery row is incomplete: ${JSON.stringify(item)}`);
    }
    if (!mediaIds.has(item.mediaId)) {
      errors.push(`gallery item ${item.id} references missing media ${item.mediaId}`);
    }
  }

  for (const service of snapshot.services ?? []) {
    if (service.deletedAt) {
      continue;
    }
    if (!service.id || !service.title || !service.mediaId || !service.icon) {
      errors.push(`service row is incomplete: ${JSON.stringify(service)}`);
    }
    if (service.mediaId && !mediaIds.has(service.mediaId)) {
      errors.push(`service ${service.id} references missing media ${service.mediaId}`);
    }
  }

  for (const section of snapshot.sections ?? []) {
    if (section.deletedAt) {
      continue;
    }
    if (!section.id || !section.group) {
      errors.push(`section row is incomplete: ${JSON.stringify(section)}`);
    }
  }

  return errors;
};

export const pathFromPublicSrc = (src) => resolve(publicRoot, src.replace(/^\//, ''));

export const getResponsiveWidths = (width) => [...new Set([720, 1200].filter((item) => item < width).concat(width))];

export const getVariantPath = (src, width, format) => pathFromPublicSrc(src).replace(/\.[^.]+$/, `-${width}w.${format}`);

export const commandExists = (command) => spawnSync('which', [command], { stdio: 'ignore' }).status === 0;

const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  }
};

export const clearCmsMedia = () => {
  rmSync(cmsMediaRoot, { force: true, recursive: true });
  mkdirSync(cmsSourceRoot, { recursive: true });
};

const ensurePrimaryWebp = (sourcePath, media) => {
  const targetPath = pathFromPublicSrc(media.src);
  mkdirSync(dirname(targetPath), { recursive: true });

  if (media.src.endsWith('.webp') && commandExists('cwebp')) {
    run('cwebp', ['-quiet', '-q', '84', sourcePath, '-o', targetPath]);
    return;
  }

  if (extname(sourcePath).toLowerCase() === extname(targetPath).toLowerCase()) {
    copyFileSync(sourcePath, targetPath);
    return;
  }

  throw new Error(`Cannot create primary CMS image ${media.src}. Install cwebp or use a matching source format.`);
};

export const optimizeCmsMedia = (media, sourcePath = pathFromPublicSrc(media.src)) => {
  const hasCwebp = commandExists('cwebp');
  const hasSips = commandExists('sips');

  if (!existsSync(sourcePath)) {
    return;
  }

  if (sourcePath !== pathFromPublicSrc(media.src)) {
    ensurePrimaryWebp(sourcePath, media);
  }

  for (const width of getResponsiveWidths(Number(media.width))) {
    if (hasCwebp && !(media.src.endsWith('.webp') && width === Number(media.width))) {
      const webpPath = getVariantPath(media.src, width, 'webp');
      mkdirSync(dirname(webpPath), { recursive: true });
      run('cwebp', ['-quiet', '-q', '82', '-resize', String(width), '0', sourcePath, '-o', webpPath]);
    }

    if (hasSips) {
      const avifPath = getVariantPath(media.src, width, 'avif');
      mkdirSync(dirname(avifPath), { recursive: true });
      run('sips', ['-s', 'format', 'avif', '-s', 'formatOptions', '50', '-Z', String(width), sourcePath, '--out', avifPath]);
    }
  }
};

const base64url = (input) => Buffer.from(input).toString('base64url');

export const getServiceAccountAccessToken = async (
  scope = 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly',
) => {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    return '';
  }

  const serviceAccount = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(JSON.stringify(claim))}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(serviceAccount.private_key, 'base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });

  if (!response.ok) {
    throw new Error('Could not authenticate Google service account');
  }

  const data = await response.json();
  return data.access_token;
};

export const extensionForMimeType = (mimeType) => {
  if (mimeType === 'image/png') {
    return '.png';
  }
  if (mimeType === 'image/avif') {
    return '.avif';
  }
  if (mimeType === 'image/jpeg') {
    return '.jpg';
  }
  return extname(mimeType) || '.webp';
};
