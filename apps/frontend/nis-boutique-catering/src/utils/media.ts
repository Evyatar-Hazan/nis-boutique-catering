import type { ImageAsset } from '../data/siteContent';

const responsiveBreakpoints = [720, 1200] as const;

const getResponsiveWidths = (image: ImageAsset) => [
  ...new Set([...responsiveBreakpoints.filter((width) => width < image.width), image.width]),
];

const getResponsiveVariantSrc = (src: string, width: number, format: 'avif' | 'webp') =>
  src.replace(/\.[^.]+$/, `-${width}w.${format}`);

export const getImageSrcSet = (image: ImageAsset, format: 'avif' | 'webp') => {
  if (!image.responsive) {
    return undefined;
  }

  const candidates = getResponsiveWidths(image).map((width) => {
    if (format === 'webp' && image.src.endsWith('.webp') && width === image.width) {
      return `${image.src} ${width}w`;
    }

    return `${getResponsiveVariantSrc(image.src, width, format)} ${width}w`;
  });

  return candidates.join(', ');
};

export const getImageProps = (image: ImageAsset) => {
  const srcSet = getImageSrcSet(image, 'webp');

  return {
    src: image.src,
    width: image.width,
    height: image.height,
    ...(srcSet ? { srcSet } : {}),
    ...(image.sizes ? { sizes: image.sizes } : {}),
  };
};
