import { type FormEventHandler } from 'react';
import {
  AudienceSection,
  ContactSection,
  CoordinationSection,
  ExperienceLabSection,
  FaqSection,
  GallerySection,
  ProcessSection,
  RealMediaSection,
  StorySection,
} from '@monorepo/site-preview';
import { email, galleryImages, type GalleryCategory } from '../data/siteContent';

type LazySiteSectionsProps = {
  readonly activeExperienceIndex: number;
  readonly activeGalleryCategory: GalleryCategory;
  readonly contactWhatsapp: string;
  readonly leadSource: string;
  readonly onChangeExperience: (index: number) => void;
  readonly onFilterChange: (category: GalleryCategory) => void;
  readonly onLeadSourceChange: (value: string) => void;
  readonly onOpenImage: (index: number | null) => void;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
};

export default function LazySiteSections({
  activeExperienceIndex,
  activeGalleryCategory,
  contactWhatsapp,
  leadSource,
  onChangeExperience,
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
      <AudienceSection />
      <ExperienceLabSection
        activeExperienceIndex={activeExperienceIndex}
        onChangeExperience={onChangeExperience}
      />
      <GallerySection
        activeCategory={activeGalleryCategory}
        images={filteredGalleryImages}
        onFilterChange={onFilterChange}
        onOpenImage={onOpenImage}
      />
      <RealMediaSection />
      <ProcessSection />
      <StorySection />
      <CoordinationSection />
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
