import {
  ContactSection,
  type ContactInquiry,
  GallerySection,
  ProcessSection,
  RealMediaSection,
  ServicesSection,
  TrustSection,
} from '@monorepo/site-preview';
import { email, galleryImages, type GalleryCategory } from '../data/siteContent';

type LazySiteSectionsProps = {
  readonly activeGalleryCategory: GalleryCategory;
  readonly contactWhatsapp: string;
  readonly onFilterChange: (category: GalleryCategory) => void;
  readonly onInquirySubmit: (inquiry: ContactInquiry) => void;
  readonly onOpenImage: (index: number | null) => void;
};

export default function LazySiteSections({
  activeGalleryCategory,
  contactWhatsapp,
  onFilterChange,
  onInquirySubmit,
  onOpenImage,
}: LazySiteSectionsProps) {
  const filteredGalleryImages =
    activeGalleryCategory === 'all'
      ? galleryImages
      : galleryImages.filter((image) => image.category === activeGalleryCategory);

  return (
    <>
      <ServicesSection />
      <GallerySection
        activeCategory={activeGalleryCategory}
        images={filteredGalleryImages}
        onFilterChange={onFilterChange}
        onOpenImage={onOpenImage}
      />
      <RealMediaSection />
      <ProcessSection />
      <TrustSection />
      <ContactSection
        contactWhatsapp={contactWhatsapp}
        email={email}
        onInquirySubmit={onInquirySubmit}
      />
    </>
  );
}
