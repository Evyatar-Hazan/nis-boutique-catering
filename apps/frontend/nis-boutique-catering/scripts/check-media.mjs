import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { appRoot, pathFromPublicSrc } from './media-utils.mjs';

const errors = [];
const expectFile = (path, label) => {
  if (!existsSync(path)) {
    errors.push(`Missing ${label}: ${path}`);
  }
};

const indexHtml = readFileSync(resolve(appRoot, 'index.html'), 'utf8');
const referencedAssets = [...indexHtml.matchAll(
  /(?:href|content)="(?:https:\/\/nisboutiquecatering\.com)?(?<src>\/[^"]+\.(?:jpg|jpeg|png|webp|avif|svg))"/g,
)].map((match) => match.groups?.src).filter(Boolean);

for (const src of referencedAssets) {
  expectFile(pathFromPublicSrc(src), `index.html media reference ${src}`);
}

for (const stylesheet of ['src/styles/base.css', 'src/styles/theme.css']) {
  const css = readFileSync(resolve(appRoot, stylesheet), 'utf8');
  if (/url\('\/media\//u.test(css)) {
    errors.push(`${stylesheet} contains a hardcoded /media background URL.`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Media check passed for ${referencedAssets.length} static document assets; CMS media is verified by content:check.`);
