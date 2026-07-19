import { type FormEventHandler } from 'react';
import {
  ContactSection,
  FaqSection,
  GallerySection,
  ProcessSection,
  RealMediaSection,
  ServicesSection,
  StorySection,
} from '@monorepo/site-preview';
import { email, galleryImages, type GalleryCategory } from '../data/siteContent';

type LazySiteSectionsProps = {
  readonly activeGalleryCategory: GalleryCategory;
  readonly contactWhatsapp: string;
  readonly leadSource: string;
  readonly onFilterChange: (category: GalleryCategory) => void;
  readonly onLeadSourceChange: (value: string) => void;
  readonly onOpenImage: (index: number | null) => void;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
};

export default function LazySiteSections({
  activeGalleryCategory,
  contactWhatsapp,
  leadSource,
  onFilterChange,
  onLeadSourceChange,
  onOpenImage,
  onSubmit,
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
      <StorySection />
      <FaqSection />
      <ContactSection
        contactWhatsapp={contactWhatsapp}
        email={email}
        leadSource={leadSource}
        onLeadSourceChange={onLeadSourceChange}
        onSubmit={onSubmit}
      />
    </>
  );
}
