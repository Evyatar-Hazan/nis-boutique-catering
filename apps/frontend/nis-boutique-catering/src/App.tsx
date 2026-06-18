import { type CSSProperties, type FormEvent, useCallback, useMemo, useState } from 'react';
import {
  AudienceSection,
  BookingBasicsSection,
  BoutiqueSection,
  ContactSection,
  CoordinationSection,
  DetailsSection,
  EditorialSection,
  ExperienceLabSection,
  FaqSection,
  GallerySection,
  HeroSection,
  IntroBandSection,
  ManifestoSection,
  ProcessSection,
  RealMediaSection,
  SamplesSection,
  SeoSection,
  SignatureSection,
  StorySection,
  TrustSection,
  ServicesSection,
} from './components/MainSections';
import { FloatingActions, Footer, LightboxDialog, Topbar } from './components/SiteChrome';
import { email, galleryImages, sectionIds, siteVersion, type GalleryCategory } from './data/siteContent';
import { useLightboxDialog } from './hooks/useLightboxDialog';
import { usePointerGlow } from './hooks/usePointerGlow';
import { useRevealOnScroll } from './hooks/useRevealOnScroll';
import { useScrollState } from './hooks/useScrollState';
import { buildInquiryWhatsappLink, buildWhatsappLink } from './utils/contact';
import './App.css';

function App() {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [activeGalleryCategory, setActiveGalleryCategory] = useState<GalleryCategory>('all');
  const [activeExperienceIndex, setActiveExperienceIndex] = useState(0);
  const [leadSource, setLeadSource] = useState('ניס בטעם של שבת');

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
        if (currentIndex === null || filteredGalleryImages.length === 0) {
          return currentIndex;
        }

        return (currentIndex + direction + filteredGalleryImages.length) % filteredGalleryImages.length;
      });
    },
    [filteredGalleryImages.length],
  );

  const lightboxRef = useLightboxDialog({
    isOpen: selectedImage !== null,
    onClose: () => setSelectedImageIndex(null),
    onNext: () => showAdjacentImage(1),
    onPrevious: () => showAdjacentImage(-1),
  });

  const topbarWhatsapp = buildWhatsappLink('שלום Nis, אשמח ליצור קשר.');
  const heroWhatsapp = buildInquiryWhatsappLink('קייטרינג בוטיק לאירוח');
  const contactWhatsapp = buildWhatsappLink('שלום Nis, אשמח ליצור קשר לגבי הזמנה.');
  const footerWhatsapp = buildWhatsappLink('שלום Nis, אשמח לקבל פרטים.');
  const floatingWhatsapp = buildWhatsappLink('שלום Nis, אשמח לקבל פרטים דרך האתר.');

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const lines = [
      `שם: ${formData.get('name') ?? ''}`,
      `טלפון: ${formData.get('phone') ?? ''}`,
      `מייל: ${formData.get('email') ?? ''}`,
      `עניין: ${formData.get('interest') ?? ''}`,
      `תאריך רצוי: ${formData.get('date') ?? ''}`,
      `מספר סועדים: ${formData.get('guests') ?? ''}`,
      `אופן קבלה מועדף: ${formData.get('delivery') ?? ''}`,
      `הודעה: ${formData.get('message') ?? ''}`,
    ];

    window.location.href = buildWhatsappLink(`שלום Nis,\n${lines.join('\n')}`);
  };

  return (
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
        <EditorialSection />
        <AudienceSection />
        <ExperienceLabSection
          activeExperienceIndex={activeExperienceIndex}
          onChangeExperience={setActiveExperienceIndex}
        />
        <SignatureSection />
        <ServicesSection />
        <BoutiqueSection />
        <GallerySection
          activeCategory={activeGalleryCategory}
          images={filteredGalleryImages}
          onFilterChange={(category) => {
            setActiveGalleryCategory(category);
            setSelectedImageIndex(null);
          }}
          onOpenImage={setSelectedImageIndex}
        />
        <RealMediaSection />
        <ProcessSection />
        <StorySection />
        <SamplesSection />
        <CoordinationSection />
        <DetailsSection />
        <BookingBasicsSection />
        <SeoSection />
        <TrustSection />
        <FaqSection />
        <ContactSection
          contactWhatsapp={contactWhatsapp}
          email={email}
          leadSource={leadSource}
          onLeadSourceChange={setLeadSource}
          onSubmit={handleContactSubmit}
        />
      </main>

      <Footer email={email} footerWhatsapp={footerWhatsapp} version={siteVersion} />
      <FloatingActions floatingWhatsapp={floatingWhatsapp} />
      <LightboxDialog
        dialogRef={lightboxRef}
        image={selectedImage}
        imageCount={filteredGalleryImages.length}
        onClose={() => setSelectedImageIndex(null)}
        onNext={() => showAdjacentImage(1)}
        onPrevious={() => showAdjacentImage(-1)}
      />
    </div>
  );
}

export default App;
