import { lazy, Suspense, type CSSProperties, type FormEvent, useCallback, useMemo, useState } from 'react';
import {
  HeroSection,
  IntroBandSection,
  ManifestoSection,
  SiteSectionPreviewDataProvider,
} from '@monorepo/site-preview';
import { DeferredSections } from './components/DeferredSections';
import { SectionSkeleton } from './components/SectionSkeleton';
import { FloatingActions, Footer, LightboxDialog, Topbar } from './components/SiteChrome';
import { contactInterestOptions, email, galleryImages, sectionIds, siteMicrocopy, siteVersion, type GalleryCategory } from './data/siteContent';
import { defaultSiteSectionPreviewData } from './data/sitePreviewData';
import { usePointerGlow } from './hooks/usePointerGlow';
import { useRevealOnScroll } from './hooks/useRevealOnScroll';
import { useScrollState } from './hooks/useScrollState';
import { buildInquiryWhatsappLink, buildWhatsappLink } from './utils/contact';
import './App.css';

const LazySiteSections = lazy(() => import('./components/LazySiteSections'));

function App() {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [activeGalleryCategory, setActiveGalleryCategory] = useState<GalleryCategory>('all');
  const [activeExperienceIndex, setActiveExperienceIndex] = useState(0);
  const [leadSource, setLeadSource] = useState(contactInterestOptions[0] ?? 'ניס בטעם של שבת');

  useRevealOnScroll();
  usePointerGlow();

  const { isScrolled, scrollProgress, activeNavSection } = useScrollState(sectionIds);

  const filteredGalleryImages = useMemo(
    () =>
      activeGalleryCategory === 'all'
        ? galleryImages
        : galleryImages.filter((image) => image.category === activeGalleryCategory),
    [activeGalleryCategory],
  );

  const selectedImage =
    selectedImageIndex === null ? null : filteredGalleryImages[selectedImageIndex] ?? null;

  const showAdjacentImage = useCallback(
    (direction: 1 | -1) => {
      setSelectedImageIndex((currentIndex) => {
        if (currentIndex === null) {
          return currentIndex;
        }

        return (currentIndex + direction + filteredGalleryImages.length) % filteredGalleryImages.length;
      });
    },
    [filteredGalleryImages.length],
  );

  const topbarWhatsapp = buildWhatsappLink(siteMicrocopy.whatsappTopbarMessage);
  const heroWhatsapp = buildInquiryWhatsappLink(siteMicrocopy.whatsappHeroTopic);
  const contactWhatsapp = buildWhatsappLink(siteMicrocopy.whatsappContactMessage);
  const footerWhatsapp = buildWhatsappLink(siteMicrocopy.whatsappFooterMessage);
  const floatingWhatsapp = buildWhatsappLink(siteMicrocopy.whatsappFloatingMessage);

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const lines = [
      `${siteMicrocopy.formNameLabel}: ${formData.get('name') ?? ''}`,
      `${siteMicrocopy.formPhoneLabel}: ${formData.get('phone') ?? ''}`,
      `${siteMicrocopy.formEmailLabel}: ${formData.get('email') ?? ''}`,
      `${siteMicrocopy.formInterestLabel}: ${formData.get('interest') ?? ''}`,
      `${siteMicrocopy.formDateLabel}: ${formData.get('date') ?? ''}`,
      `${siteMicrocopy.formGuestsLabel}: ${formData.get('guests') ?? ''}`,
      `${siteMicrocopy.formDeliveryLabel}: ${formData.get('delivery') ?? ''}`,
      `${siteMicrocopy.formMessageLabel}: ${formData.get('message') ?? ''}`,
    ];

    window.location.href = buildWhatsappLink(`שלום Nis,\n${lines.join('\n')}`);
  };

  return (
    <SiteSectionPreviewDataProvider value={defaultSiteSectionPreviewData}>
    <div className="site-shell" style={{ '--scroll-progress': scrollProgress } as CSSProperties}>
      <a className="skip-link" href="#main">
        דלג לתוכן המרכזי
      </a>
      <div className="scroll-progress" aria-hidden="true" />

      <Topbar
        activeNavSection={activeNavSection}
        isScrolled={isScrolled}
        topbarWhatsapp={topbarWhatsapp}
      />

      <main id="main">
        <HeroSection heroWhatsapp={heroWhatsapp} />
        <IntroBandSection />
        <ManifestoSection />
        <DeferredSections>
          <Suspense fallback={<SectionSkeleton />}>
            <LazySiteSections
              activeExperienceIndex={activeExperienceIndex}
              activeGalleryCategory={activeGalleryCategory}
              contactWhatsapp={contactWhatsapp}
              leadSource={leadSource}
              onChangeExperience={setActiveExperienceIndex}
              onFilterChange={(category) => {
                setActiveGalleryCategory(category);
                setSelectedImageIndex(null);
              }}
              onLeadSourceChange={setLeadSource}
              onOpenImage={setSelectedImageIndex}
              onSubmit={handleContactSubmit}
            />
          </Suspense>
        </DeferredSections>
      </main>

      <Footer email={email} footerWhatsapp={footerWhatsapp} version={siteVersion} />
      <FloatingActions floatingWhatsapp={floatingWhatsapp} />
      <LightboxDialog
        image={selectedImage}
        imageCount={filteredGalleryImages.length}
        onClose={() => setSelectedImageIndex(null)}
        onNext={() => showAdjacentImage(1)}
        onPrevious={() => showAdjacentImage(-1)}
      />
    </div>
    </SiteSectionPreviewDataProvider>
  );
}

export default App;
