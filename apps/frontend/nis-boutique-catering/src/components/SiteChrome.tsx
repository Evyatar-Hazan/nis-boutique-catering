import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Menu, MessageCircle, Phone, X } from 'lucide-react';
import { Dialog, OptimizedImage } from '@monorepo/site-preview';
import { brandMedia, navItems, phoneDisplay, phoneHref, siteMicrocopy, type ImageAsset } from '../data/siteContent';

interface TopbarProps {
  readonly activeNavSection: string;
  readonly isScrolled: boolean;
  readonly topbarWhatsapp: string;
}

export const Topbar = ({ activeNavSection, isScrolled, topbarWhatsapp }: TopbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);
  return (
    <header className={isScrolled ? 'topbar is-scrolled' : 'topbar'} aria-label="ניווט ראשי">
      <a className="brand" href="#top" aria-label="Nis, boutique catering">
        <OptimizedImage className="brand-logo" image={brandMedia.logo} alt="Nis - boutique catering" decoding="async" />
      </a>
      <nav id="primary-navigation" className={isMenuOpen ? 'nav-links is-open' : 'nav-links'} aria-label="עמודי האתר">
        {navItems.map((item) => (
          <a key={item.href} href={item.href} className={activeNavSection === item.href ? 'is-active' : undefined} onClick={() => setIsMenuOpen(false)}>
            {item.label}
          </a>
        ))}
      </nav>
      <a className="topbar-cta" href={topbarWhatsapp} data-event="topbar_whatsapp">
        <MessageCircle aria-hidden="true" size={18} />
        {siteMicrocopy.topbarWhatsappLabel}
      </a>
      <button ref={menuButtonRef} className="mobile-menu-toggle" type="button" aria-expanded={isMenuOpen} aria-controls="primary-navigation" aria-label={isMenuOpen ? 'סגירת תפריט' : 'פתיחת תפריט'} onClick={() => setIsMenuOpen((current) => !current)}>
        {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
    </header>
  );
};

export const Footer = ({
  email,
  footerWhatsapp,
  version,
}: {
  readonly email: string;
  readonly footerWhatsapp: string;
  readonly version: string;
}) => (
  <footer className="site-footer">
    <div className="container footer-grid">
      <div className="footer-brand">
        <strong>Nis</strong>
        <span>boutique catering</span>
        <p>{siteMicrocopy.footerTagline}</p>
        <small className="footer-version">Version {version}</small>
        <a className="creator-credit" href="https://EvyatarHazan.com" target="_blank" rel="noreferrer">
          נבנה באהבה על ידי EvyatarHazan.com
        </a>
      </div>
      <div className="footer-links">
        <a href={phoneHref}>{phoneDisplay}</a>
        <a href={`mailto:${email}`}>{email}</a>
        <a href={footerWhatsapp}>{siteMicrocopy.footerWhatsappLabel}</a>
        <a className="studio-footer-link" href="https://studio.nisboutiquecatering.com/" target="_blank" rel="noreferrer">{siteMicrocopy.studioLoginLabel}</a>
      </div>
    </div>
  </footer>
);

export const FloatingActions = ({ floatingWhatsapp }: { readonly floatingWhatsapp: string }) => (
  <>
    <a className="floating-whatsapp" href={floatingWhatsapp} aria-label={siteMicrocopy.floatingWhatsappAria}>
      <MessageCircle aria-hidden="true" />
    </a>

    <div className="mobile-sticky-cta" aria-label={siteMicrocopy.mobileActionsAria}>
      <a href={floatingWhatsapp}>
        <MessageCircle aria-hidden="true" size={18} />
        {siteMicrocopy.mobileWhatsappLabel}
      </a>
      <a href={phoneHref}>
        <Phone aria-hidden="true" size={18} />
        {siteMicrocopy.mobilePhoneLabel}
      </a>
    </div>
  </>
);

interface LightboxDialogProps {
  readonly image: {
    readonly alt: string;
    readonly image: ImageAsset;
    readonly title: string;
  } | null;
  readonly imageCount: number;
  readonly onClose: () => void;
  readonly onNext: () => void;
  readonly onPrevious: () => void;
}

export const LightboxDialog = ({
  image,
  imageCount,
  onClose,
  onNext,
  onPrevious,
}: LightboxDialogProps) => {
  if (!image) {
    return null;
  }

  return (
    <Dialog
      bodyClassName="is-lightbox-open"
      className="lightbox"
      labelledBy="lightbox-caption"
      onClose={onClose}
      open
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); onNext(); }
        if (event.key === 'ArrowRight') { event.preventDefault(); onPrevious(); }
      }}
    >
      <button
        className="lightbox-backdrop"
        type="button"
        tabIndex={-1}
        onClick={onClose}
        aria-label="סגור תצוגת תמונה"
      />
      <button
        className="lightbox-close"
        type="button"
        onClick={onClose}
        aria-label="סגור תמונה"
      >
        <X aria-hidden="true" />
      </button>
      {imageCount > 1 ? (
        <>
          <button
            className="lightbox-nav lightbox-next"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onNext();
            }}
            aria-label="תמונה הבאה"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            className="lightbox-nav lightbox-prev"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPrevious();
            }}
            aria-label="תמונה קודמת"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </>
      ) : null}
      <OptimizedImage image={image.image} alt={image.alt} decoding="async" />
      <p id="lightbox-caption" className="lightbox-caption">
        {image.title}
      </p>
    </Dialog>
  );
};
