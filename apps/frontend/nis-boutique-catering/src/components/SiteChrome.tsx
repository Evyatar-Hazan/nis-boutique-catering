import { type RefObject } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Phone, X } from 'lucide-react';
import { brandMedia, navItems, phoneDisplay, phoneHref, type ImageAsset } from '../data/siteContent';
import { OptimizedImage } from './OptimizedImage';

interface TopbarProps {
  readonly activeNavSection: string;
  readonly isScrolled: boolean;
  readonly topbarWhatsapp: string;
}

export const Topbar = ({ activeNavSection, isScrolled, topbarWhatsapp }: TopbarProps) => (
  <header className={isScrolled ? 'topbar is-scrolled' : 'topbar'} aria-label="ניווט ראשי">
    <a className="brand" href="#top" aria-label="Nis, boutique catering">
      <OptimizedImage
        className="brand-logo"
        image={brandMedia.logo}
        alt="Nis - boutique catering"
        decoding="async"
      />
    </a>
    <nav className="nav-links">
      {navItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={activeNavSection === item.href ? 'is-active' : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
    <a className="topbar-cta" href={topbarWhatsapp} data-event="topbar_whatsapp">
      <MessageCircle aria-hidden="true" size={18} />
      וואטסאפ
    </a>
  </header>
);

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
        <p>אוכל של בית, גימור של בוטיק.</p>
        <small className="footer-version">Version {version}</small>
      </div>
      <div className="footer-links">
        <a href={phoneHref}>{phoneDisplay}</a>
        <a href={`mailto:${email}`}>{email}</a>
        <a href={footerWhatsapp}>וואטסאפ</a>
      </div>
    </div>
  </footer>
);

export const FloatingActions = ({ floatingWhatsapp }: { readonly floatingWhatsapp: string }) => (
  <>
    <a className="floating-whatsapp" href={floatingWhatsapp} aria-label="דברו איתנו בוואטסאפ">
      <MessageCircle aria-hidden="true" />
    </a>

    <div className="mobile-sticky-cta" aria-label="פעולות מהירות ליצירת קשר">
      <a href={floatingWhatsapp}>
        <MessageCircle aria-hidden="true" size={18} />
        וואטסאפ
      </a>
      <a href={phoneHref}>
        <Phone aria-hidden="true" size={18} />
        טלפון
      </a>
    </div>
  </>
);

interface LightboxDialogProps {
  readonly dialogRef: RefObject<HTMLDivElement | null>;
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
  dialogRef,
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
    <div
      ref={dialogRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-caption"
      tabIndex={-1}
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
    </div>
  );
};
