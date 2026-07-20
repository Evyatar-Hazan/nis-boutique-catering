import { type CSSProperties } from 'react';
import type { GalleryCategory, GalleryImage } from './sitePreviewTypes';
import { OptimizedImage } from './OptimizedImage';
import { useSiteSectionPreviewData } from './SiteSectionPreviewData';
import { SectionHeading, TextParagraphs } from './SectionShared';

const galleryFilterLabels: Readonly<Record<GalleryCategory, string>> = {
  all: 'הכל',
  coffee: 'קפה',
  fish: 'דגים',
  salads: 'סלטים',
  tables: 'שולחנות',
  trays: 'מגשים',
};

export const getGalleryFilters = (images: readonly GalleryImage[]) => {
  const available = new Set(images.map((image) => image.category));
  return (Object.keys(galleryFilterLabels) as GalleryCategory[])
    .filter((category) => category === 'all' || available.has(category))
    .map((id) => ({ id, label: galleryFilterLabels[id] }));
};

interface GallerySectionProps {
  readonly activeCategory: GalleryCategory;
  readonly images: readonly GalleryImage[];
  readonly onFilterChange: (category: GalleryCategory) => void;
  readonly onOpenImage: (index: number) => void;
}

export const GallerySection = ({
  activeCategory,
  images,
  onFilterChange,
  onOpenImage,
}: GallerySectionProps) => {
  const { foodMedia, sectionCopy, videoMedia } = useSiteSectionPreviewData();
  const filters = getGalleryFilters(images);
  const filteredImages = activeCategory === 'all'
    ? images
    : images.filter((image) => image.category === activeCategory);
  const visibleImages = activeCategory === 'all' ? filteredImages.slice(0, 6) : filteredImages;

  return (
    <section id="gallery" className="section gallery-media-section" aria-labelledby="gallery-title">
      <div className="container">
        <SectionHeading eyebrow={sectionCopy.gallery.eyebrow} title={sectionCopy.gallery.title} id="gallery-title" className="section-heading gallery-heading reveal">
          <TextParagraphs text={sectionCopy.gallery.text} />
        </SectionHeading>
        <div className="gallery-tabs reveal" aria-label="סינון גלריה לפי סוג">
          {filters.map((category) => (
            <button
              className={category.id === activeCategory ? 'gallery-tab is-active' : 'gallery-tab'}
              key={category.id}
              type="button"
              onClick={() => onFilterChange(category.id)}
              aria-pressed={category.id === activeCategory}
            >
              {category.label}
            </button>
          ))}
        </div>
        <div className="gallery-media-layout">
          <figure className="gallery-video reveal">
            <video controls muted playsInline preload="metadata" poster={foodMedia.hostingTableOverview.src} aria-label="וידאו מהאירוח">
              <source src={videoMedia.eventVideo} type="video/mp4" />
            </video>
            <figcaption>רגע אמיתי מההכנה ומהאירוח של Nis</figcaption>
          </figure>
          <div className="gallery-grid" aria-live="polite">
            {visibleImages.map((image, index) => (
              <button
                className={image.tall ? 'gallery-item tall reveal' : 'gallery-item reveal'}
                key={image.title}
                style={{ '--delay': `${(index % 6) * 55}ms` } as CSSProperties}
                type="button"
                onClick={() => onOpenImage(index)}
                aria-label={`פתח תמונה: ${image.title}`}
              >
                <OptimizedImage image={image.image} alt={image.alt} loading="lazy" decoding="async" />
                <span>{image.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
