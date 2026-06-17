import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const siteContentPath = resolve(appRoot, 'src/data/siteContent.ts');
const siteContent = readFileSync(siteContentPath, 'utf8');

const assetBlockPattern =
  /(?<key>[a-zA-Z][a-zA-Z0-9]*):\s*\{\s*src:\s*'(?<src>\/[^']+)'\s*,\s*width:\s*(?<width>\d+)\s*,\s*height:\s*(?<height>\d+)(?<body>[\s\S]*?)\n\s*\}/g;

const uniqueBySrc = new Map();

for (const match of siteContent.matchAll(assetBlockPattern)) {
  const src = match.groups?.src;

  if (!src || uniqueBySrc.has(src)) {
    continue;
  }

  uniqueBySrc.set(src, {
    key: match.groups?.key ?? src,
    src,
    width: Number(match.groups?.width),
    height: Number(match.groups?.height),
    responsive: /responsive:\s*true/.test(match.groups?.body ?? ''),
  });
}

export const imageAssets = [...uniqueBySrc.values()];
export const responsiveBreakpoints = [720, 1200];

export const appPathFromPublicSrc = (src) => resolve(appRoot, `public${src}`);

export const getResponsiveWidths = (asset) => [
  ...new Set([...responsiveBreakpoints.filter((width) => width < asset.width), asset.width]),
];

export const getVariantSrc = (src, width, format) => src.replace(/\.[^.]+$/, `-${width}w.${format}`);

export const getVariantPath = (asset, width, format) =>
  appPathFromPublicSrc(getVariantSrc(asset.src, width, format));

export { appRoot, siteContentPath };

