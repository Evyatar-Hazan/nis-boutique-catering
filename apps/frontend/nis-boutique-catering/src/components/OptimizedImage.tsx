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

  return (
    <picture className="optimized-picture">
      <source type="image/avif" srcSet={getImageSrcSet(image, 'avif')} sizes={image.sizes} />
      <source type="image/webp" srcSet={getImageSrcSet(image, 'webp')} sizes={image.sizes} />
      <img {...getImageProps(image)} {...imgProps} alt={alt} />
    </picture>
  );
};
