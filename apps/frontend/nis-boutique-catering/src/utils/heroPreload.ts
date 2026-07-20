import {
  getPrimaryHeroMediaId,
  getResponsiveImageSrcSet,
  heroImageSizes,
  type ResponsiveImageAsset,
} from '@monorepo/content-schema/media';
import type { ContentSnapshot } from '@monorepo/content-schema';

export interface HeroPreload {
  readonly href: string;
  readonly imageSrcSet?: string;
  readonly imageSizes?: string;
  readonly type: 'image/avif' | 'image/webp';
}

const lastSrcSetCandidate = (srcSet: string) => {
  const candidate = srcSet.split(', ').at(-1);
  return candidate?.split(' ')[0];
};

export const createHeroPreload = (
  content: ContentSnapshot,
  fallbackMediaId = 'salmon-skewers-lemon',
): HeroPreload => {
  const mediaId = getPrimaryHeroMediaId(content) ?? fallbackMediaId;
  const image = content.media.find((item) => item.id === mediaId && !item.deletedAt);
  if (!image) {
    throw new Error(`Cannot create the Hero preload: media ${mediaId} is missing.`);
  }

  const responsiveImage: ResponsiveImageAsset = image;
  const usesCmsWebp = image.src.includes('/media/cms/');
  const format = usesCmsWebp ? 'webp' : 'avif';
  const imageSrcSet = getResponsiveImageSrcSet(responsiveImage, format);
  const href = imageSrcSet ? lastSrcSetCandidate(imageSrcSet) : image.src;
  if (!href) {
    throw new Error(`Cannot create the Hero preload URL for media ${mediaId}.`);
  }

  return {
    href,
    ...(imageSrcSet ? { imageSrcSet } : {}),
    imageSizes: heroImageSizes,
    type: format === 'avif' ? 'image/avif' : 'image/webp',
  };
};
