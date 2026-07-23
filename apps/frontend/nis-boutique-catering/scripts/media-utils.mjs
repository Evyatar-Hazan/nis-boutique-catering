import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { getResponsiveImageWidths } from '@monorepo/content-schema/media';

export const appRoot = resolve(import.meta.dirname, '..');
export const publicRoot = resolve(appRoot, 'public');
export const cmsMediaRoot = resolve(publicRoot, 'media/cms');
export const cmsSourceRoot = resolve(cmsMediaRoot, '_source');

export const pathFromPublicSrc = (src, targetPublicRoot = publicRoot) =>
  resolve(targetPublicRoot, src.replace(/^\//, ''));

export const getVariantPath = (src, width, format, targetPublicRoot = publicRoot) =>
  pathFromPublicSrc(src, targetPublicRoot).replace(/\.[^.]+$/, `-${width}w.${format}`);

export const commandExists = (command) =>
  spawnSync('which', [command], { stdio: 'ignore' }).status === 0;

export const runCommand = (command, args) => {
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
    runCommand('cwebp', ['-quiet', '-q', '84', sourcePath, '-o', targetPath]);
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
      runCommand('cwebp', ['-quiet', '-q', '82', '-resize', String(width), '0', sourcePath, '-o', webpPath]);
    }

    if (hasSips) {
      const avifPath = getVariantPath(media.src, width, 'avif', targetPublicRoot);
      mkdirSync(dirname(avifPath), { recursive: true });
      runCommand('sips', ['-s', 'format', 'avif', '-s', 'formatOptions', '50', '-Z', String(width), sourcePath, '--out', avifPath]);
    }
  }
};
