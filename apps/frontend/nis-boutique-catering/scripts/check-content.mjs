import { existsSync } from 'node:fs';
import { fallbackPath, generatedJsonPath, pathFromPublicSrc, readJson, validateContentShape } from './content-utils.mjs';

const errors = [];

for (const [label, path] of [
  ['fallback content', fallbackPath],
  ['generated content', generatedJsonPath],
]) {
  if (!existsSync(path)) {
    errors.push(`Missing ${label}: ${path}`);
    continue;
  }

  const snapshot = readJson(path);
  errors.push(...validateContentShape(snapshot).map((error) => `${label}: ${error}`));

  for (const media of snapshot.media ?? []) {
    const mediaPath = pathFromPublicSrc(media.src);
    if (!media.driveFileId && media.src.startsWith('/media/') && !existsSync(mediaPath)) {
      errors.push(`${label}: missing media source ${media.src}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Content check passed.');
