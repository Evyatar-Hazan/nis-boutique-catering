import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  appPathFromPublicSrc,
  appRoot,
  getResponsiveWidths,
  getVariantPath,
  imageAssets,
} from './media-assets.mjs';

const errors = [];
const warn = [];

const expectFile = (path, label) => {
  if (!existsSync(path)) {
    errors.push(`Missing ${label}: ${path}`);
  }
};

for (const asset of imageAssets) {
  expectFile(appPathFromPublicSrc(asset.src), `source asset ${asset.src}`);

  if (!asset.responsive) {
    continue;
  }

  for (const width of getResponsiveWidths(asset)) {
    const sourceIsWebp = asset.src.endsWith('.webp');

    if (!(sourceIsWebp && width === asset.width)) {
      expectFile(getVariantPath(asset, width, 'webp'), `WebP variant ${asset.src} ${width}w`);
    }

    expectFile(getVariantPath(asset, width, 'avif'), `AVIF variant ${asset.src} ${width}w`);
  }
}

const indexHtml = readFileSync(resolve(appRoot, 'index.html'), 'utf8');

for (const src of [...indexHtml.matchAll(/(?:href|content)="(?:https:\/\/nisboutiquecatering\.com)?(?<src>\/[^"]+\.(?:jpg|jpeg|png|webp|avif|svg))"/g)].map(
  (match) => match.groups?.src,
)) {
  if (src) {
    expectFile(appPathFromPublicSrc(src), `index.html media reference ${src}`);
  }
}

for (const srcSet of indexHtml.matchAll(/imagesrcset="(?<srcset>[^"]+)"/g)) {
  const candidates = srcSet.groups?.srcset.split(',') ?? [];

  for (const candidate of candidates) {
    const src = candidate.trim().split(/\s+/)[0];
    expectFile(appPathFromPublicSrc(src), `index.html preload candidate ${src}`);
  }
}

for (const stylesheet of ['src/styles/base.css', 'src/styles/theme.css']) {
  const css = readFileSync(resolve(appRoot, stylesheet), 'utf8');

  if (/url\('\/media\//.test(css)) {
    warn.push(`${stylesheet} still contains a hardcoded /media background URL.`);
  }
}

if (warn.length > 0) {
  console.warn(warn.join('\n'));
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Media check passed for ${imageAssets.length} image assets.`);

