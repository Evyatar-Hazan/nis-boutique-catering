import {
  createHash,
} from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, resolve } from 'node:path';
import {
  assertUniquePublicFaqQuestions,
  deduplicatePublicFaqQuestions,
  getPublicMediaReferenceIds,
  publicSiteDocumentSchema,
} from '@monorepo/content-schema';

import {
  appRoot,
  clearCmsMedia,
  optimizeCmsMedia,
} from './media-utils.mjs';
import { createHeroPreload } from '../src/utils/heroPreload';

const apiOrigin = process.env.CLOUDFLARE_CONTENT_API_ORIGIN?.replace(/\/$/u, '');
if (!apiOrigin) {
  throw new Error('CLOUDFLARE_CONTENT_API_ORIGIN is required; Cloudflare sync has no implicit fallback.');
}
const outputAppRoot = process.env.CLOUDFLARE_SYNC_OUTPUT_ROOT
  ? resolve(process.env.CLOUDFLARE_SYNC_OUTPUT_ROOT)
  : appRoot;
const outputPublicRoot = resolve(outputAppRoot, 'public');
const outputCmsMediaRoot = resolve(outputPublicRoot, 'media/cms');
const outputCmsSourceRoot = resolve(outputCmsMediaRoot, '_source');

const fetchWithRetry = async (url: string, attempt = 1): Promise<Response> => {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (response.ok || attempt >= 3 || ![408, 425, 429, 500, 502, 503, 504].includes(response.status)) {
    return response;
  }
  await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 1_000));
  return fetchWithRetry(url, attempt + 1);
};

const publishedResponse = await fetchWithRetry(`${apiOrigin}/api/content/published`);
if (!publishedResponse.ok) {
  throw new Error(`Could not read published content (status ${publishedResponse.status}).`);
}
const publishedPayload: unknown = await publishedResponse.json();
const revision = typeof publishedPayload === 'object' && publishedPayload !== null
  && 'revision' in publishedPayload
  ? publishedPayload.revision
  : null;
const parsedContent = publicSiteDocumentSchema.parse(
  typeof revision === 'object' && revision !== null && 'content' in revision
    ? revision.content
    : null,
);
const content = {
  ...parsedContent,
  sections: {
    ...parsedContent.sections,
    contact: {
      ...parsedContent.sections.contact,
      faqs: deduplicatePublicFaqQuestions(parsedContent.sections.contact.faqs),
    },
  },
};
assertUniquePublicFaqQuestions(content.sections.contact.faqs);
const referencedIds = getPublicMediaReferenceIds(content);
const mediaById = new Map(content.media.map((asset) => [asset.id, asset]));
const stagingRoot = mkdtempSync(resolve(tmpdir(), 'nis-cloudflare-sync-'));

try {
  for (const mediaId of referencedIds) {
    const asset = mediaById.get(mediaId);
    if (!asset || asset.archivedAt) {
      throw new Error(`Published media ${mediaId} is missing or archived.`);
    }
    const response = await fetchWithRetry(
      `${apiOrigin}/api/content/media?id=${encodeURIComponent(mediaId)}`,
    );
    if (!response.ok) {
      throw new Error(`Could not download published media ${mediaId} (status ${response.status}).`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const checksum = createHash('sha256').update(bytes).digest('hex');
    if (checksum !== asset.checksum || bytes.byteLength !== asset.sizeBytes) {
      throw new Error(`Published media ${mediaId} failed checksum or byte-count verification.`);
    }
    const extension = asset.kind === 'video'
      ? (asset.mimeType === 'video/webm' ? '.webm' : '.mp4')
      : (asset.mimeType === 'image/png'
          ? '.png'
          : asset.mimeType === 'image/jpeg'
            ? '.jpg'
            : asset.mimeType === 'image/avif'
              ? '.avif'
              : '.webp');
    const stagedPath = resolve(stagingRoot, `${mediaId}${extension}`);
    writeFileSync(stagedPath, bytes);
  }

  clearCmsMedia(outputCmsMediaRoot);
  for (const mediaId of referencedIds) {
    const asset = mediaById.get(mediaId);
    if (!asset) {
      throw new Error(`Published media ${mediaId} disappeared during sync.`);
    }
    const sourceName = [
      `${mediaId}.webp`,
      `${mediaId}.png`,
      `${mediaId}.jpg`,
      `${mediaId}.avif`,
      `${mediaId}.mp4`,
      `${mediaId}.webm`,
    ].find((candidate) => existsSync(resolve(stagingRoot, candidate)));
    if (!sourceName) {
      throw new Error(`Staged media ${mediaId} is missing.`);
    }
    const stagedPath = resolve(stagingRoot, sourceName);
    const sourcePath = resolve(outputCmsSourceRoot, sourceName);
    mkdirSync(dirname(sourcePath), { recursive: true });
    writeFileSync(sourcePath, readFileSync(stagedPath));
    if (asset.kind === 'image') {
      optimizeCmsMedia({
        height: asset.height,
        id: asset.id,
        src: `/media/cms/${asset.id}.webp`,
        width: asset.width,
      }, sourcePath, outputPublicRoot);
    } else {
      const target = resolve(outputAppRoot, `public/media/cms/${asset.id}${extname(sourceName)}`);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(sourcePath));
    }
  }

  const exactTsPath = resolve(outputAppRoot, 'src/generated/publicSiteDocument.generated.ts');
  mkdirSync(dirname(exactTsPath), { recursive: true });
  writeFileSync(
    exactTsPath,
    `export const publicSiteDocument = ${JSON.stringify(content, null, 2)} as const;\n\n`
      + `export const generatedHeroPreload = ${JSON.stringify(createHeroPreload(content), null, 2)} as const;\n`,
  );
  console.log(`Synced published revision with ${referencedIds.length} referenced media objects from Cloudflare.`);
} finally {
  rmSync(stagingRoot, { force: true, recursive: true });
}
