import {
  ContactSection,
  type ContactInquiry,
  GallerySection,
  ProcessSection,
  ServicesSection,
  TrustSection,
} from '@monorepo/site-preview';
import { email, galleryImages, type GalleryCategory } from '../data/siteContent';

type LazySiteSectionsProps = {
  readonly activeGalleryCategory: GalleryCategory;
  readonly contactWhatsapp: string;
  readonly onFilterChange: (category: GalleryCategory) => void;
  readonly onFormStart: () => void;
  readonly onInquirySubmit: (inquiry: ContactInquiry) => void;
  readonly onOpenImage: (index: number | null) => void;
  readonly onValidationResult: (result: {
    readonly invalidFieldCount: number;
    readonly result: 'valid' | 'invalid';
  }) => void;
};

export default function LazySiteSections({
  activeGalleryCategory,
  contactWhatsapp,
  onFilterChange,
  onFormStart,
  onInquirySubmit,
  onOpenImage,
  onValidationResult,
}: LazySiteSectionsProps) {
  return (
    <>
      <ServicesSection />
      <GallerySection
        activeCategory={activeGalleryCategory}
        images={galleryImages}
        onFilterChange={onFilterChange}
        onOpenImage={onOpenImage}
      />
      <ProcessSection />
      <TrustSection />
      <ContactSection
        contactWhatsapp={contactWhatsapp}
        email={email}
        onFormStart={onFormStart}
        onInquirySubmit={onInquirySubmit}
        onValidationResult={onValidationResult}
      />
    </>
  );
}
