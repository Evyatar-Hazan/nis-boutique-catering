import { existsSync, mkdirSync } from 'node:fs';
import { dirname, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  appPathFromPublicSrc,
  getResponsiveWidths,
  getVariantPath,
  imageAssets,
} from './media-assets.mjs';

const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8' });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')}\n${result.stderr || result.stdout}`);
  }
};

const commandExists = (command) =>
  spawnSync('which', [command], { stdio: 'ignore' }).status === 0;

const supportsSipsFormat = (format) => {
  const result = spawnSync('sips', ['--formats'], { encoding: 'utf8' });
  return result.status === 0 && result.stdout.includes(format);
};

const hasCwebp = commandExists('cwebp');
const hasAvif = commandExists('sips') && supportsSipsFormat('public.avif');

if (!hasCwebp) {
  throw new Error('Missing cwebp. Install WebP tools before running media optimization.');
}

if (!hasAvif) {
  console.warn('AVIF output skipped: sips does not report public.avif support on this machine.');
}

let written = 0;

for (const asset of imageAssets.filter((item) => item.responsive)) {
  const sourcePath = appPathFromPublicSrc(asset.src);

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing source asset: ${asset.src}`);
  }

  for (const width of getResponsiveWidths(asset)) {
    const webpPath = getVariantPath(asset, width, 'webp');
    const sourceIsWebp = extname(asset.src).toLowerCase() === '.webp';

    if (!(sourceIsWebp && width === asset.width)) {
      mkdirSync(dirname(webpPath), { recursive: true });
      run('cwebp', ['-quiet', '-q', '82', '-resize', String(width), '0', sourcePath, '-o', webpPath]);
      written += 1;
    }

    if (hasAvif) {
      const avifPath = getVariantPath(asset, width, 'avif');
      mkdirSync(dirname(avifPath), { recursive: true });
      run('sips', [
        '-s',
        'format',
        'avif',
        '-s',
        'formatOptions',
        '50',
        '-Z',
        String(width),
        sourcePath,
        '--out',
        avifPath,
      ]);
      written += 1;
    }
  }
}

console.log(`Media optimization complete. Wrote ${written} responsive files.`);
