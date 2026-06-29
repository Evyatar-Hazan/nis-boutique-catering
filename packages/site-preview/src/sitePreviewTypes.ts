export interface ImageAsset {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly sizes?: string;
  readonly responsive?: boolean;
}

export type GalleryCategory = 'all' | 'tables' | 'trays' | 'salads' | 'coffee' | 'fish';

export interface GalleryImage {
  readonly title: string;
  readonly alt: string;
  readonly image: ImageAsset;
  readonly category: GalleryCategory;
  readonly tall?: boolean;
}
