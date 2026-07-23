import {
  getResponsiveImageSrcSet,
  heroImageSizes,
  type ResponsiveImageAsset,
} from '@monorepo/content-schema';

interface HeroPreloadDocument {
  readonly media: readonly {
    readonly archivedAt?: string;
    readonly height: number;
    readonly id: string;
    readonly kind: 'image' | 'video';
    readonly width?: number;
  }[];
  readonly sections: {
    readonly hero: {
      readonly mediaId: string;
    };
  };
}

export interface HeroPreload {
  readonly href: string;
  readonly imageSizes: string;
  readonly imageSrcSet?: string;
  readonly type: 'image/webp';
}

const lastSrcSetCandidate = (srcSet: string) => {
  const candidate = srcSet.split(', ').at(-1);
  return candidate?.split(' ')[0];
};

export const createHeroPreload = (
  document: HeroPreloadDocument,
): HeroPreload => {
  const mediaId = document.sections.hero.mediaId;
  const media = document.media.find(
    (asset) => asset.id === mediaId && asset.kind === 'image' && !asset.archivedAt,
  );
  if (!media || media.kind !== 'image' || media.width === undefined) {
    throw new Error(`Cannot create the Hero preload: active image ${mediaId} is missing.`);
  }

  const image: ResponsiveImageAsset = {
    height: media.height,
    responsive: true,
    sizes: heroImageSizes,
    src: `/media/cms/${media.id}.webp`,
    width: media.width,
  };
  const imageSrcSet = getResponsiveImageSrcSet(image, 'webp');
  const href = imageSrcSet ? lastSrcSetCandidate(imageSrcSet) : image.src;
  if (!href) {
    throw new Error(`Cannot create the Hero preload URL for media ${mediaId}.`);
  }

  return {
    href,
    ...(imageSrcSet ? { imageSrcSet } : {}),
    imageSizes: heroImageSizes,
    type: 'image/webp',
  };
};
