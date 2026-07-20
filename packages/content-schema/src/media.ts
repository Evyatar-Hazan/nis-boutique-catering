export interface ResponsiveImageAsset {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly sizes?: string;
  readonly responsive?: boolean;
}

export interface HeroMediaContent {
  readonly sections: readonly {
    readonly id: string;
    readonly active: boolean;
    readonly deletedAt?: string;
    readonly items: readonly string[];
  }[];
}

export const getPrimaryHeroMediaId = (content: HeroMediaContent) => {
  const heroMedia = content.sections.find(
    (section) => section.id === 'hero-media' && section.active && !section.deletedAt,
  );

  // Legacy content stored a background image first and the visible Hero image second.
  // The v2 Cloudflare document has one Hero image, so it occupies the first position.
  return heroMedia?.items[1] ?? heroMedia?.items[0];
};

const repositoryMediaBreakpoints = [720, 1200] as const;
const cmsMediaBreakpoints = [720, 960, 1200] as const;

export const getResponsiveImageWidths = (image: ResponsiveImageAsset) => {
  const breakpoints = image.src.includes('/media/cms/')
    ? cmsMediaBreakpoints
    : repositoryMediaBreakpoints;

  return [...new Set([...breakpoints.filter((width) => width < image.width), image.width])];
};

const getResponsiveVariantSrc = (
  src: string,
  width: number,
  format: 'avif' | 'webp',
) => src.replace(/\.[^.]+$/, `-${width}w.${format}`);

const hasFormatVariants = (image: ResponsiveImageAsset, format: 'avif' | 'webp') => {
  if (format === 'webp') {
    return true;
  }

  // CMS images are generated from Drive during the Linux Cloudflare build.
  // That build creates WebP variants, while repository media also has AVIF variants.
  return !image.src.includes('/media/cms/');
};

export const getResponsiveImageSrcSet = (
  image: ResponsiveImageAsset,
  format: 'avif' | 'webp',
) => {
  if (!image.responsive || !hasFormatVariants(image, format)) {
    return undefined;
  }

  return getResponsiveImageWidths(image).map((width) => {
    if (format === 'webp' && image.src.endsWith('.webp') && width === image.width) {
      return `${image.src} ${width}w`;
    }

    return `${getResponsiveVariantSrc(image.src, width, format)} ${width}w`;
  }).join(', ');
};

export const getResponsiveImageProps = (image: ResponsiveImageAsset) => {
  const srcSet = getResponsiveImageSrcSet(image, 'webp');

  return {
    src: image.src,
    width: image.width,
    height: image.height,
    ...(srcSet ? { srcSet } : {}),
    ...(image.sizes ? { sizes: image.sizes } : {}),
  };
};
