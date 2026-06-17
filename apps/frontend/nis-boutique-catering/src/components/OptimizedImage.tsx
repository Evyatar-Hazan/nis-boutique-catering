import type { ImgHTMLAttributes } from 'react';
import type { ImageAsset } from '../data/siteContent';
import { getImageProps, getImageSrcSet } from '../utils/media';

type OptimizedImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'height' | 'sizes' | 'src' | 'srcSet' | 'width'
> & {
  readonly alt: string;
  readonly image: ImageAsset;
};

export const OptimizedImage = ({ alt, image, ...imgProps }: OptimizedImageProps) => {
  if (!image.responsive) {
    return <img {...getImageProps(image)} {...imgProps} alt={alt} />;
  }

  const avifSrcSet = getImageSrcSet(image, 'avif');
  const webpSrcSet = getImageSrcSet(image, 'webp');

  return (
    <picture className="optimized-picture">
      {avifSrcSet ? <source type="image/avif" srcSet={avifSrcSet} sizes={image.sizes} /> : null}
      {webpSrcSet ? <source type="image/webp" srcSet={webpSrcSet} sizes={image.sizes} /> : null}
      <img {...getImageProps(image)} {...imgProps} alt={alt} />
    </picture>
  );
};
