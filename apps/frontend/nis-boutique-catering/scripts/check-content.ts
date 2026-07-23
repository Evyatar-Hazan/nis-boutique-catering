import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assertUniquePublicFaqQuestions,
  getPublicMediaReferenceIds,
  getResponsiveImageSrcSet,
  heroImageSizes,
  publicSiteDocumentSchema,
  type ResponsiveImageAsset,
} from '@monorepo/content-schema';
import { publicSiteDocument } from '../src/generated/publicSiteDocument.generated';
import { appRoot } from './media-utils.mjs';

const document = publicSiteDocumentSchema.parse(publicSiteDocument);
assertUniquePublicFaqQuestions(document.sections.contact.faqs);
const mediaById = new Map(document.media.map((asset) => [asset.id, asset]));
const referencedIds = getPublicMediaReferenceIds(document);
const missingReferences = referencedIds.filter((mediaId) => {
  const asset = mediaById.get(mediaId);
  return !asset || Boolean(asset.archivedAt);
});

if (missingReferences.length > 0) {
  throw new Error(`Missing or archived referenced media: ${missingReferences.join(', ')}`);
}

const requireGeneratedMedia = process.env.CONTENT_CHECK_REQUIRE_GENERATED_MEDIA === '1';
const missingGeneratedMedia = requireGeneratedMedia
  ? referencedIds.flatMap((mediaId) => {
      const asset = mediaById.get(mediaId);
      if (!asset) {
        return [mediaId];
      }
      const extension = asset.kind === 'image'
        ? '.webp'
        : asset.mimeType === 'video/webm'
          ? '.webm'
          : '.mp4';
      const primarySrc = `/media/cms/${asset.id}${extension}`;
      if (asset.kind !== 'image') {
        return existsSync(resolve(appRoot, `public${primarySrc}`)) ? [] : [primarySrc];
      }
      const image: ResponsiveImageAsset = {
        height: asset.height,
        responsive: true,
        sizes: heroImageSizes,
        src: primarySrc,
        width: asset.width,
      };
      const variants = getResponsiveImageSrcSet(image, 'webp')
        ?.split(', ')
        .map((candidate) => candidate.split(' ')[0]) ?? [primarySrc];
      return variants.filter((src) => !existsSync(resolve(appRoot, `public${src}`)));
    })
  : [];

if (missingGeneratedMedia.length > 0) {
  throw new Error(`Missing generated public media: ${missingGeneratedMedia.join(', ')}`);
}

console.log(
  `Content check passed for schema v${document.schemaVersion} with ${referencedIds.length} media references`
    + `${requireGeneratedMedia ? ' and generated media' : ''}.`,
);
