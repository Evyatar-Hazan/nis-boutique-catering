import type { GalleryCategory, GalleryImage } from './sitePreviewTypes';
import { useSiteSectionPreviewData } from './SiteSectionPreviewData';
import { OptimizedImage, SectionHeading } from './primitives';

const galleryFilterLabels: Readonly<Record<GalleryCategory, string>> = {
  all: 'הכל',
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
  const { gallery } = useSiteSectionPreviewData();
  const filters = getGalleryFilters(images);
  const filteredImages = activeCategory === 'all'
    ? images
    : images.filter((image) => image.category === activeCategory);
  const visibleImages = activeCategory === 'all' ? filteredImages.slice(0, 6) : filteredImages;

  return (
    <section id="gallery" className="section gallery-media-section scroll-scene scroll-scene--gallery" aria-labelledby="gallery-title">
      <div className="container">
        <SectionHeading eyebrow={gallery.eyebrow} title={gallery.title} id="gallery-title" className="section-heading gallery-heading reveal">
          {gallery.description ? <p>{gallery.description}</p> : null}
        </SectionHeading>
        <div className="gallery-tabs reveal" role="group" data-reveal-duration="360" data-reveal-variant="fade" aria-label="סינון גלריה לפי סוג">
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
          <div className="gallery-grid" data-reveal-stagger="55" aria-live="polite">
            {visibleImages.map((image, index) => (
              <button
                className={image.tall ? 'gallery-item tall reveal' : 'gallery-item reveal'}
                key={image.title}
                data-reveal-duration="620"
                data-reveal-threshold="0.08"
                data-reveal-variant="gallery"
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
