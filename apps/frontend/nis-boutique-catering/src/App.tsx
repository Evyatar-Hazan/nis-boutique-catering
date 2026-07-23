import { lazy, Suspense, type CSSProperties, type MouseEvent, useCallback, useMemo, useState } from 'react';
import {
  type ContactInquiry,
  HeroSection,
  SiteSectionPreviewDataProvider,
} from '@monorepo/site-preview';
import { DeferredSections } from './components/DeferredSections';
import { SectionSkeleton } from './components/SectionSkeleton';
import { FloatingActions, Footer, LightboxDialog, Topbar } from './components/SiteChrome';
import {
  email,
  galleryImages,
  sectionIds,
  siteMicrocopy,
  siteSectionData,
  siteVersion,
  type GalleryCategory,
} from './data/siteContent';
import { PaletteLab } from './features/palette-lab/PaletteLab';
import { AccessibilityStatementPage } from './features/accessibility/AccessibilityStatementPage';
import { isAccessibilityStatementPath } from './features/accessibility/isAccessibilityStatementPath';
import { usePointerGlow } from './hooks/usePointerGlow';
import { useRevealOnScroll } from './hooks/useRevealOnScroll';
import { useScrollState } from './hooks/useScrollState';
import { buildInquiryWhatsappLink, buildWhatsappLink } from './utils/contact';
import './App.css';

const LazySiteSections = lazy(() => import('./components/LazySiteSections'));

function PublicSiteApp() {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [activeGalleryCategory, setActiveGalleryCategory] = useState<GalleryCategory>('all');

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
  const heroWhatsapp = buildInquiryWhatsappLink(siteSectionData.hero.primaryCta.message);
  const contactWhatsapp = buildWhatsappLink(siteSectionData.contact.submitCta.message);
  const footerWhatsapp = buildWhatsappLink(siteMicrocopy.whatsappFooterMessage);
  const floatingWhatsapp = buildWhatsappLink(siteMicrocopy.whatsappFloatingMessage);

  const handleSkipLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById('main')?.focus();
  };

  const handleContactSubmit = (inquiry: ContactInquiry) => {
    const lines = [
      `${siteSectionData.contact.formLabels.name}: ${inquiry.name}`,
      `${siteSectionData.contact.formLabels.phone}: ${inquiry.phone}`,
      `${siteSectionData.contact.formLabels.interest}: ${inquiry.interest}`,
      inquiry.date ? `${siteSectionData.contact.formLabels.date}: ${inquiry.date}` : '',
      inquiry.guests ? `${siteSectionData.contact.formLabels.guests}: ${inquiry.guests}` : '',
      inquiry.message ? `${siteSectionData.contact.formLabels.message}: ${inquiry.message}` : '',
    ];

    window.location.href = buildWhatsappLink(`שלום Nis,\n${lines.filter(Boolean).join('\n')}`);
  };

  return (
    <SiteSectionPreviewDataProvider value={siteSectionData}>
    <div className="site-shell" style={{ '--scroll-progress': scrollProgress } as CSSProperties}>
      <a className="skip-link" href="#main" onClick={handleSkipLinkClick}>
        דלג לתוכן המרכזי
      </a>
      <div className="scroll-progress" aria-hidden="true" />

      <Topbar
        activeNavSection={activeNavSection}
        isScrolled={isScrolled}
        topbarWhatsapp={topbarWhatsapp}
      />

      <main id="main" tabIndex={-1}>
        <HeroSection heroWhatsapp={heroWhatsapp} />
        <DeferredSections>
          <Suspense fallback={<SectionSkeleton />}>
            <LazySiteSections
              activeGalleryCategory={activeGalleryCategory}
              contactWhatsapp={contactWhatsapp}
              onFilterChange={(category) => {
                setActiveGalleryCategory(category);
                setSelectedImageIndex(null);
              }}
              onInquirySubmit={handleContactSubmit}
              onOpenImage={setSelectedImageIndex}
            />
          </Suspense>
        </DeferredSections>
      </main>

      <Footer email={email} footerWhatsapp={footerWhatsapp} version={siteVersion} />
      <FloatingActions floatingWhatsapp={floatingWhatsapp} />
      <PaletteLab />
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

function App() {
  return isAccessibilityStatementPath(window.location.pathname) ? <AccessibilityStatementPage /> : <PublicSiteApp />;
}

export default App;
