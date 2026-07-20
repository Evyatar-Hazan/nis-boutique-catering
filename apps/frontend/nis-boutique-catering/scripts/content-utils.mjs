import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { getResponsiveImageWidths } from '@monorepo/content-schema/media';

export const appRoot = resolve(import.meta.dirname, '..');
export const fallbackPath = resolve(appRoot, 'content/fallback-content.json');
export const generatedJsonPath = resolve(appRoot, 'src/generated/siteContent.generated.json');
export const generatedTsPath = resolve(appRoot, 'src/generated/siteContent.generated.ts');
export const publicRoot = resolve(appRoot, 'public');
export const cmsMediaRoot = resolve(publicRoot, 'media/cms');
export const cmsSourceRoot = resolve(cmsMediaRoot, '_source');

export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

export const writeGeneratedSnapshot = (snapshot, targetAppRoot = appRoot) => {
  const targetJsonPath = resolve(targetAppRoot, 'src/generated/siteContent.generated.json');
  const targetTsPath = resolve(targetAppRoot, 'src/generated/siteContent.generated.ts');
  mkdirSync(dirname(targetJsonPath), { recursive: true });
  const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
  writeFileSync(targetJsonPath, serialized);
  writeFileSync(
    targetTsPath,
    `import type { ContentSnapshot } from '@monorepo/content-schema';\n\nexport const contentSnapshot: ContentSnapshot = ${JSON.stringify(snapshot, null, 2)};\n`,
  );
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

export const pathFromPublicSrc = (src, targetPublicRoot = publicRoot) => resolve(targetPublicRoot, src.replace(/^\//, ''));

export const getVariantPath = (src, width, format, targetPublicRoot = publicRoot) =>
  pathFromPublicSrc(src, targetPublicRoot).replace(/\.[^.]+$/, `-${width}w.${format}`);

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

export const clearCmsMedia = (targetCmsMediaRoot = cmsMediaRoot) => {
  rmSync(targetCmsMediaRoot, { force: true, recursive: true });
  mkdirSync(resolve(targetCmsMediaRoot, '_source'), { recursive: true });
};

const ensurePrimaryWebp = (sourcePath, media, targetPublicRoot) => {
  const targetPath = pathFromPublicSrc(media.src, targetPublicRoot);
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

export const optimizeCmsMedia = (
  media,
  sourcePath = pathFromPublicSrc(media.src),
  targetPublicRoot = publicRoot,
) => {
  const hasCwebp = commandExists('cwebp');
  const hasSips = commandExists('sips');

  if (!existsSync(sourcePath)) {
    return;
  }

  if (sourcePath !== pathFromPublicSrc(media.src, targetPublicRoot)) {
    ensurePrimaryWebp(sourcePath, media, targetPublicRoot);
  }

  for (const width of getResponsiveImageWidths(media)) {
    if (hasCwebp && !(media.src.endsWith('.webp') && width === Number(media.width))) {
      const webpPath = getVariantPath(media.src, width, 'webp', targetPublicRoot);
      mkdirSync(dirname(webpPath), { recursive: true });
      run('cwebp', ['-quiet', '-q', '82', '-resize', String(width), '0', sourcePath, '-o', webpPath]);
    }

    if (hasSips) {
      const avifPath = getVariantPath(media.src, width, 'avif', targetPublicRoot);
      mkdirSync(dirname(avifPath), { recursive: true });
      run('sips', ['-s', 'format', 'avif', '-s', 'formatOptions', '50', '-Z', String(width), sourcePath, '--out', avifPath]);
    }
  }
};
