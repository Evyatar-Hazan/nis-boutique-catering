import type { ImageAsset } from './sitePreviewTypes';
import {
  getResponsiveImageProps,
  getResponsiveImageSrcSet,
} from '@monorepo/content-schema/media';

export const getImageSrcSet = (
  image: ImageAsset,
  format: 'avif' | 'webp',
) => getResponsiveImageSrcSet(image, format);

export const getImageProps = (image: ImageAsset) => getResponsiveImageProps(image);
