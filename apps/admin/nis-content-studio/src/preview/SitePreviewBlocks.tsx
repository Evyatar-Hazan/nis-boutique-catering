import { createPortal } from 'react-dom';
import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Eye, ExternalLink, FileText, HeartHandshake, RefreshCw, RotateCcw, Search, ShieldCheck, Sparkles, Tag, Trash2 } from 'lucide-react';
import {
  type ContentSnapshot,
  type ImageAssetRecord,
  type SectionBlockRecord,
} from '@monorepo/content-schema';
import {
  AudienceSection,
  buildSiteSectionPreviewData,
  ContactSection,
  CoordinationSection,
  ExperienceLabSection,
  FaqSection,
  GallerySection,
  HeroSection,
  IntroBandSection,
  ManifestoSection,
  ProcessSection,
  RealMediaSection,
  SiteSectionPreviewDataProvider,
  StorySection,
} from '@monorepo/site-preview';
import siteBaseCss from '@monorepo/site-preview/styles/base.css?raw';
import siteThemeCss from '@monorepo/site-preview/styles/theme.css?raw';
import { publicSiteOrigin } from '../assetUrlHelpers';
import { getDriveFileDownloadUrl } from '../googleApi';
import { exactPreviewCopySectionIds, exactPreviewSectionGroupIds } from '../previewParityContract';
import type { PreviewDevice } from '../components/editor/types';
import { getDriveFileViewUrl, shortSourceId } from '../studioHelpers';

const sectionGroupLabels: Readonly<Record<string, string>> = {
  hero: 'מסך פתיחה',
  audience: 'למי זה מתאים',
  intro: 'פתיח',
  'site-copy': 'טקסטי מעטפת',
  'site-microcopy': 'טקסטים קטנים',
  editorial: 'מה מזמינים אצלנו',
  manifesto: 'השפה של Nis',
  process: 'איך זה עובד',
  signature: 'רגעי בוטיק',
  story: 'הסיפור של המותג',
  samples: 'כיוונים להזמנה',
  coordination: 'תיאום וזמינות',
  faq: 'שאלות ותשובות',
  trust: 'אמון',
};

const previewViewportByDevice: Readonly<Record<PreviewDevice, { width: number; height: number }>> = {
  desktop: { width: 1440, height: 810 },
  mobile: { width: 390, height: 844 },
};

const shadowPreviewCss = `
${siteBaseCss}
${siteThemeCss}

:root {
  color-scheme: light;
}

html, body {
  margin: 0;
  min-height: 100%;
  width: 100%;
}

body {
  display: block;
  color: var(--ink);
}

#preview-root {
  min-height: 100%;
  width: 100%;
  container-type: inline-size;
}

*, *::before, *::after {
  box-sizing: border-box;
}

.studio-site-preview-shell {
  min-height: 100%;
  overflow: hidden;
}

.studio-site-preview-shell::before,
.studio-site-preview-shell::after {
  position: absolute;
}

.studio-site-preview-shell .container {
  width: min(100%, calc(100% - 32px));
}

.studio-site-preview-shell .section {
  min-height: 100%;
  display: grid;
  align-items: center;
}

.studio-site-preview-shell .intro-band {
  min-height: 100%;
}

.studio-site-preview-shell .reveal {
  opacity: 1;
  transform: none;
}

@container (max-width: 760px) {
  .studio-site-preview-shell .intro-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }

  .studio-site-preview-shell .intro-band h2 {
    font-size: clamp(1.8rem, 8cqw, 3rem);
    line-height: 1.02;
  }

  .studio-site-preview-shell .intro-band p:not(.eyebrow) {
    font-size: 0.95rem;
    line-height: 1.7;
  }
}

@container (max-width: 460px) {
  .studio-site-preview-shell .section {
    align-items: start;
    padding-block: 28px;
  }

  .studio-site-preview-shell .container {
    width: min(100%, calc(100% - 24px));
  }

  .studio-site-preview-shell .intro-band .intro-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }

  .studio-site-preview-shell .intro-band h2 {
    font-size: clamp(1.5rem, 10cqw, 2.35rem);
    line-height: 1.06;
  }

  .studio-site-preview-shell .intro-band p:not(.eyebrow) {
    font-size: 0.88rem;
    line-height: 1.62;
  }
}
`;

const buildPreviewWhatsappLink = (base: string, message: string) => `${base}?text=${encodeURIComponent(message)}`;

const PreviewBrowserBar = ({ device }: { readonly device: PreviewDevice }) => (
  <div className="preview-browser-bar">
    <span>{device === 'mobile' ? '390px מובייל' : 'אתר במחשב'}</span>
    <strong>nisboutiquecatering.com</strong>
  </div>
);

const IframeSitePreview = ({
  device,
  children,
}: {
  readonly device: PreviewDevice;
  readonly children: ReactNode;
}) => {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [iframeNode, setIframeNode] = useState<HTMLIFrameElement | null>(null);
  const [contentHeight, setContentHeight] = useState<number>(previewViewportByDevice[device].height);
  const setIframeRef = useCallback((node: HTMLIFrameElement | null) => {
    if (!node) {
      setIframeNode(null);
      setMountNode(null);
      return;
    }

    const doc = node.contentDocument;
    if (!doc) {
      return;
    }

    doc.open();
    doc.write(`<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8" /><base href="${publicSiteOrigin}/" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${shadowPreviewCss}</style></head><body><div id="preview-root"></div></body></html>`);
    doc.close();
    setIframeNode(node);
    setMountNode(doc.getElementById('preview-root'));
  }, []);
  const viewport = previewViewportByDevice[device];

  useEffect(() => {
    if (!iframeNode || !mountNode) {
      return undefined;
    }

    const doc = iframeNode.contentDocument;
    const root = doc?.documentElement;
    const body = doc?.body;
    if (!doc || !root || !body) {
      return undefined;
    }

    let cancelled = false;

    const syncPreviewHeight = () => {
      if (cancelled) {
        return;
      }

      doc.querySelectorAll('img').forEach((image) => {
        image.setAttribute('loading', 'eager');
        image.setAttribute('decoding', 'sync');
        image.setAttribute('fetchpriority', 'high');
      });

      const nextHeight = Math.max(viewport.height, root.scrollHeight, body.scrollHeight, mountNode.scrollHeight);
      setContentHeight(nextHeight);
    };

    const blockExternalPreviewNavigation = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest('a[href]');
      if (!link) {
        return;
      }

      const href = link.getAttribute('href') ?? '';
      if (href.startsWith('#')) {
        return;
      }

      event.preventDefault();
    };

    const resizeObserver = new ResizeObserver(() => {
      syncPreviewHeight();
    });

    resizeObserver.observe(root);
    resizeObserver.observe(body);
    resizeObserver.observe(mountNode);
    doc.addEventListener('click', blockExternalPreviewNavigation, true);

    const loadListeners = Array.from(doc.images).map((image) => {
      const handleLoad = () => syncPreviewHeight();
      image.addEventListener('load', handleLoad);
      image.addEventListener('error', handleLoad);
      return { image, handleLoad };
    });

    const rafId = window.requestAnimationFrame(() => {
      syncPreviewHeight();
    });
    const timeoutId = window.setTimeout(syncPreviewHeight, 120);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      resizeObserver.disconnect();
      doc.removeEventListener('click', blockExternalPreviewNavigation, true);
      loadListeners.forEach(({ image, handleLoad }) => {
        image.removeEventListener('load', handleLoad);
        image.removeEventListener('error', handleLoad);
      });
    };
  }, [device, iframeNode, mountNode, viewport.height]);

  return (
    <div
      className={`iframe-site-preview ${device === 'mobile' ? 'is-mobile' : 'is-desktop'}`}
      style={{
        '--preview-viewport-width': `${viewport.width}px`,
        '--preview-viewport-height': `${viewport.height}px`,
        '--preview-content-height': `${contentHeight}px`,
      } as CSSProperties}
    >
      <iframe ref={setIframeRef} className="iframe-site-preview-frame" title={`site-preview-${device}`} />
      {mountNode ? createPortal(children, mountNode) : null}
    </div>
  );
};

const ActualSiteSectionFrame = ({
  content,
  mediaById,
  device,
  children,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
  readonly children: ReactNode;
}) => {
  const previewData = useMemo(() => buildSiteSectionPreviewData(content, mediaById), [content, mediaById]);

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <IframeSitePreview device={device}>
        <SiteSectionPreviewDataProvider value={previewData}>
          <div className="site-shell studio-site-preview-shell">{children}</div>
        </SiteSectionPreviewDataProvider>
      </IframeSitePreview>
    </div>
  );
};

export const HeroSitePreview = ({
  content,
  hero,
  device,
  mediaById,
}: {
  readonly content: ContentSnapshot;
  readonly hero: SectionBlockRecord;
  readonly device: PreviewDevice;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
}) => {
  const heroWhatsapp = buildPreviewWhatsappLink(content.settings.whatsappBase, `שלום Nis, אשמח לשמוע פרטים על ${hero.items[1] || hero.title || 'קייטרינג בוטיק לאירוח'}.`);
  return (
    <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
      <HeroSection heroWhatsapp={heroWhatsapp} />
    </ActualSiteSectionFrame>
  );
};

export const IntroBandPreview = ({
  content,
  device,
  mediaById,
}: {
  readonly content: ContentSnapshot;
  readonly device: PreviewDevice;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
}) => (
  <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
    <IntroBandSection />
  </ActualSiteSectionFrame>
);

const ActualExperienceLabPreview = ({
  content,
  mediaById,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => {
  const [activeExperienceIndex, setActiveExperienceIndex] = useState(0);
  return (
    <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
      <ExperienceLabSection activeExperienceIndex={activeExperienceIndex} onChangeExperience={setActiveExperienceIndex} />
    </ActualSiteSectionFrame>
  );
};

export const ExactCopySectionPreview = ({
  sectionId,
  content,
  mediaById,
  device,
}: {
  readonly sectionId: string;
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => {
  if (!exactPreviewCopySectionIds.includes(sectionId as typeof exactPreviewCopySectionIds[number])) {
    return null;
  }

  if (sectionId === 'experience-lab') {
    return <ActualExperienceLabPreview content={content} mediaById={mediaById} device={device} />;
  }

  if (sectionId === 'real-media') {
    return (
      <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
        <RealMediaSection />
      </ActualSiteSectionFrame>
    );
  }

  return null;
};

const ActualGalleryPreview = ({
  content,
  mediaById,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => {
  const previewData = useMemo(() => buildSiteSectionPreviewData(content, mediaById), [content, mediaById]);
  const [activeCategory, setActiveCategory] = useState<typeof previewData.galleryImages[number]['category'] | 'all'>('all');
  const visibleImages = useMemo(
    () => (activeCategory === 'all' ? previewData.galleryImages : previewData.galleryImages.filter((image) => image.category === activeCategory)),
    [activeCategory, previewData.galleryImages],
  );

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <IframeSitePreview device={device}>
        <SiteSectionPreviewDataProvider value={previewData}>
          <div className="site-shell studio-site-preview-shell">
            <GallerySection activeCategory={activeCategory} images={visibleImages} onFilterChange={setActiveCategory} onOpenImage={() => undefined} />
          </div>
        </SiteSectionPreviewDataProvider>
      </IframeSitePreview>
    </div>
  );
};

const ActualContactPreview = ({
  content,
  mediaById,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => {
  const previewData = useMemo(() => buildSiteSectionPreviewData(content, mediaById), [content, mediaById]);
  const [leadSource, setLeadSource] = useState(previewData.contactInterestOptions[0] ?? 'ניס בטעם של שבת');
  const contactWhatsapp = buildPreviewWhatsappLink(content.settings.whatsappBase, previewData.siteMicrocopy.whatsappContactMessage);

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <IframeSitePreview device={device}>
        <SiteSectionPreviewDataProvider value={previewData}>
          <div className="site-shell studio-site-preview-shell">
            <ContactSection
              contactWhatsapp={contactWhatsapp}
              email={content.settings.email}
              leadSource={leadSource}
              onLeadSourceChange={setLeadSource}
              onSubmit={(event) => event.preventDefault()}
            />
          </div>
        </SiteSectionPreviewDataProvider>
      </IframeSitePreview>
    </div>
  );
};

export const ContactPreview = ({
  content,
  device,
  mediaById,
}: {
  readonly content: ContentSnapshot;
  readonly device: PreviewDevice;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
}) => <ActualContactPreview content={content} mediaById={mediaById} device={device} />;

export const ManifestoSitePreview = ({
  content,
  mediaById,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => (
  <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
    <ManifestoSection />
  </ActualSiteSectionFrame>
);

export const ServicesPreview = ({
  content,
  mediaById,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => <ActualExperienceLabPreview content={content} mediaById={mediaById} device={device} />;

export const GallerySitePreview = ({
  content,
  mediaById,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => <ActualGalleryPreview content={content} mediaById={mediaById} device={device} />;

const seoTitleFallback = 'Nis Boutique Catering';
const seoDescriptionFallback = 'תיאור קצר שיופיע במנועי חיפוש ובשיתוף קישורים.';

const getSeoStatus = (value: string, min: number, max: number) => {
  if (!value.trim()) {
    return { label: 'חסר', tone: 'warning' } as const;
  }
  if (value.length < min) {
    return { label: 'קצר מדי', tone: 'warning' } as const;
  }
  if (value.length > max) {
    return { label: 'ארוך מדי', tone: 'warning' } as const;
  }
  return { label: 'תקין', tone: 'good' } as const;
};

export const MetadataSeoPreview = ({ content, device }: { readonly content: ContentSnapshot; readonly device: PreviewDevice }) => {
  const title = content.settings.seoTitle || seoTitleFallback;
  const description = content.settings.seoDescription || seoDescriptionFallback;
  const titleStatus = getSeoStatus(content.settings.seoTitle ?? '', 20, 60);
  const descriptionStatus = getSeoStatus(content.settings.seoDescription ?? '', 70, 160);
  const cleanUrl = publicSiteOrigin.replace('https://', '');

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <div className="site-section-preview site-section-preview-frame metadata-site-preview">
        <div className="metadata-preview-heading">
          <p className="kicker">מטה דאטה ו-SEO</p>
          <h3>כך האתר נראה כשמשתפים אותו או מוצאים אותו בגוגל.</h3>
          <p>הכותרת והתיאור צריכים להיות ברורים, קצרים ומוכנים ללקוח. הסטטוס כאן עוזר לזהות בעיות לפני פרסום.</p>
        </div>
        <div className="metadata-preview-grid">
          <article className="metadata-search-card" aria-label="תצוגת חיפוש Google">
            <div className="metadata-card-heading">
              <Search aria-hidden="true" />
              <span>Google</span>
            </div>
            <span className="metadata-url">{cleanUrl}</span>
            <h4>{title}</h4>
            <p>{description}</p>
          </article>
          <article className="metadata-share-card" aria-label="תצוגת שיתוף קישור">
            <div className="metadata-share-image">
              <img src={`${publicSiteOrigin}/brand/nis-logo.svg`} alt="" />
            </div>
            <div>
              <span>{cleanUrl}</span>
              <h4>{title}</h4>
              <p>{description}</p>
            </div>
          </article>
          <article className="metadata-health-card" aria-label="בדיקת שדות SEO">
            <div className="metadata-card-heading">
              <Eye aria-hidden="true" />
              <span>בדיקת שדות</span>
            </div>
            <div className="metadata-health-row">
              <strong>כותרת SEO</strong>
              <span>{title.length} תווים</span>
              <mark className={`is-${titleStatus.tone}`}>{titleStatus.tone === 'good' ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}{titleStatus.label}</mark>
            </div>
            <div className="metadata-health-row">
              <strong>תיאור SEO</strong>
              <span>{description.length} תווים</span>
              <mark className={`is-${descriptionStatus.tone}`}>{descriptionStatus.tone === 'good' ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}{descriptionStatus.label}</mark>
            </div>
            <div className="metadata-version-row">
              <span>גרסת תוכן</span>
              <strong>{content.settings.siteVersion || content.version}</strong>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

const SectionPreviewBody = ({
  group,
  sections,
  copy,
}: {
  readonly group: string;
  readonly sections: readonly SectionBlockRecord[];
  readonly copy: { readonly eyebrow: string; readonly title: string; readonly text: string };
}) => {
  if (sections.length === 0) {
    return (
      <>
        <p className="kicker">{copy.eyebrow}</p>
        <h3>{copy.title}</h3>
        <p>{copy.text}</p>
        <div className="empty-state">
          <FileText aria-hidden="true" />
          <strong>אין פריטים פעילים באזור הזה</strong>
          <span>הדליקו פריט אחד לפחות כדי שיופיע באתר.</span>
        </div>
      </>
    );
  }

  if (group === 'process') {
    return (
      <>
        <p className="kicker">{copy.eyebrow}</p>
        <h3>{copy.title}</h3>
        <p>{copy.text}</p>
        <div className="preview-process-list">
          {sections.map((section, index) => (
            <article key={section.id}>
              <span>{index + 1}</span>
              <CheckCircle2 aria-hidden="true" />
              <h3>{section.title}</h3>
              <p>{section.text}</p>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (group === 'faq') {
    return (
      <div className="preview-faq-site-grid">
        <div className="preview-faq-copy">
          <p className="kicker">{copy.eyebrow}</p>
          <h3>{copy.title}</h3>
          {copy.text && <p>{copy.text}</p>}
          <div className="preview-faq-meta" aria-label="סיכום שאלות">
            <span>{sections.length} שאלות פעילות</span>
            <span>מוצג כאקורדיון באתר</span>
          </div>
        </div>
        <div className="preview-faq-list">
          {sections.map((section, index) => (
            <details key={section.id} open={index === 0}>
              <summary>{section.title}</summary>
              <p>{section.text}</p>
            </details>
          ))}
        </div>
      </div>
    );
  }

  if (group === 'site-microcopy') {
    return (
      <>
        <p className="kicker">{copy.eyebrow}</p>
        <h3>{copy.title}</h3>
        <p>{copy.text}</p>
        <div className="preview-content-grid">
          {sections.slice(0, 8).map((section) => (
            <article key={section.id}>
              <Tag aria-hidden="true" />
              <h3>{section.title}</h3>
              <p>{section.text || section.items.join(' | ')}</p>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (group === 'trust') {
    return (
      <div className="preview-trust-site">
        <div className="preview-trust-heading">
          <p className="kicker">{copy.eyebrow}</p>
          <h3>{copy.title}</h3>
          {copy.text && <p>{copy.text}</p>}
          <div className="preview-trust-summary" aria-label="סיכום אמון">
            <span>{sections.length} כרטיסי אמון פעילים</span>
            <span>מופיע לפני שאלות ויצירת קשר</span>
          </div>
        </div>
        <div className="preview-trust-grid">
          {sections.map((section, index) => (
            <article key={section.id}>
              {index % 2 === 0 ? <ShieldCheck aria-hidden="true" /> : <HeartHandshake aria-hidden="true" />}
              <h3>{section.title}</h3>
              <p>{section.text}</p>
              {section.items.length > 0 && (
                <div className="preview-mini-tags">
                  {section.items.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="kicker">{copy.eyebrow}</p>
      <h3>{copy.title}</h3>
      <p>{copy.text}</p>
      <div className="preview-content-grid">
        {sections.map((section) => (
          <article key={section.id}>
            <Sparkles aria-hidden="true" />
            <h3>{section.title}</h3>
            <p>{section.text}</p>
            {section.items.length > 0 && (
              <div className="preview-mini-tags">
                {section.items.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  );
};

const sectionPreviewCopy: Readonly<Record<string, { readonly eyebrow: string; readonly title: string; readonly text: string }>> = {
  audience: {
    eyebrow: 'למי זה מתאים',
    title: 'מבינים מהר אם Nis מתאימה לאירוח שלכם.',
    text: 'כרטיסים קצרים שעוזרים ללקוח לזהות את עצמו לפני פנייה.',
  },
  editorial: {
    eyebrow: 'מה מזמינים אצלנו',
    title: 'שלוש כניסות ברורות לעולם של Nis.',
    text: 'פתיח קצר לקטגוריות המרכזיות באתר.',
  },
  'site-copy': {
    eyebrow: 'טקסטי מעטפת',
    title: 'הכותרות והפתיחים שמחזיקים את כל האתר.',
    text: 'כל כרטיס כאן משפיע על אזור אחר באתר: תווית קטנה, כותרת ראשית וטקסט הסבר.',
  },
  'site-microcopy': {
    eyebrow: 'טקסטים קטנים',
    title: 'הכפתורים, הטופס והודעות הוואטסאפ בלי קוד.',
    text: 'כאן עורכים מילים קצרות שמופיעות בלחיצות, בטופס ובפעולות יצירת קשר.',
  },
  manifesto: {
    eyebrow: 'השפה של Nis',
    title: 'בוטיק, ביתיות ותשומת לב לפרטים.',
    text: 'האזור שמסביר את התחושה והאופי לפני שמגיעים להזמנה.',
  },
  boutique: {
    eyebrow: 'למה זה בוטיק',
    title: 'כל הזמנה מקבלת יחס אישי ושפה נקייה.',
    text: 'נקודות הערך שהופכות את השירות למדויק יותר ממדף קבוע.',
  },
  signature: {
    eyebrow: 'רגעי בוטיק',
    title: 'פרטים קטנים שמרגישים על השולחן.',
    text: 'טקסטים שמלווים את התמונות ומחזקים את החוויה.',
  },
  process: {
    eyebrow: 'איך זה עובד',
    title: 'ארבעה צעדים קצרים מהרעיון ועד אוכל שמוכן להגשה.',
    text: 'כך הלקוח יבין את הדרך מהפנייה הראשונה ועד הסיכום.',
  },
  story: {
    eyebrow: 'הסיפור של המותג',
    title: 'Nis נולדה מתוך אהבה לאירוח יפה ואוכל ביתי מדויק.',
    text: 'תחנות קצרות שמסבירות מאיפה המותג בא ומה הוא מביא לשולחן.',
  },
  samples: {
    eyebrow: 'כיוונים להזמנה',
    title: 'כיווני תפריט שעוזרים להתחיל שיחה.',
    text: 'כל כרטיס נותן ללקוח רעיון ברור למה אפשר להזמין.',
  },
  coordination: {
    eyebrow: 'תיאום וזמינות',
    title: 'פרטים מעשיים שמורידים חיכוך לפני פנייה.',
    text: 'מידע קצר שמסביר זמינות, אזור פעילות ואיך סוגרים פרטים.',
  },
  trust: {
    eyebrow: 'מה מרגיע לפני שסוגרים',
    title: 'פחות סימני שאלה, יותר תחושה שיש עם מי לדבר.',
    text: 'כרטיסי אמון שמופיעים לקראת סוף האתר ומחזקים את הפנייה.',
  },
  faq: {
    eyebrow: 'שאלות נפוצות',
    title: 'התשובות שמקלות על הפנייה הראשונה.',
    text: 'שאלות ותשובות כפי שהן יופיעו באתר.',
  },
};

export const SectionGroupSitePreview = ({
  group,
  title,
  content,
  mediaById,
  sections,
  allSections,
  device,
}: {
  readonly group: string;
  readonly title: string;
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly sections: readonly SectionBlockRecord[];
  readonly allSections: readonly SectionBlockRecord[];
  readonly device: PreviewDevice;
}) => {
  const activeSections = sections.filter((section) => section.active && !section.deletedAt);
  const fallbackCopy = sectionPreviewCopy[group] ?? {
    eyebrow: sectionGroupLabels[group] ?? title,
    title,
    text: 'כך האזור הזה יופיע באתר אחרי פרסום.',
  };
  const managedCopy = allSections.find((section) => section.group === 'site-copy' && section.id === `copy-${group}` && section.active && !section.deletedAt);
  const copy = {
    eyebrow: managedCopy?.items[0] || fallbackCopy.eyebrow,
    title: managedCopy?.title || fallbackCopy.title,
    text: managedCopy?.text || fallbackCopy.text,
  };

  const exactGroup = exactPreviewSectionGroupIds.find((item) => item === group);
  if (exactGroup) {
    const sectionByGroup: Record<typeof exactPreviewSectionGroupIds[number], ReactNode> = {
      audience: <AudienceSection />,
      process: <ProcessSection />,
      story: <StorySection />,
      coordination: <CoordinationSection />,
      faq: <FaqSection />,
    };

    return (
      <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
        {sectionByGroup[exactGroup]}
      </ActualSiteSectionFrame>
    );
  }

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <div className={`site-section-preview site-section-preview-frame section-group-preview section-group-preview-${group}`}>
        <SectionPreviewBody group={group} sections={activeSections} copy={copy} />
      </div>
    </div>
  );
};

export const PreviewLoadingFrame = ({ device }: { readonly device: PreviewDevice }) => (
  <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
    <PreviewBrowserBar device={device} />
    <div className="site-section-preview site-section-preview-frame">
      <div className="empty-preview">
        <RefreshCw aria-hidden="true" />
        <span>טוען תצוגה מקדימה...</span>
      </div>
    </div>
  </div>
);

export const DrivePreviewImage = ({
  media,
  accessToken,
  showActions = true,
}: {
  readonly media?: ImageAssetRecord;
  readonly accessToken: string;
  readonly showActions?: boolean;
}) => {
  const [preview, setPreview] = useState<{ readonly fileId: string; readonly objectUrl: string; readonly failed: boolean } | null>(null);
  const [failedFallbackSrc, setFailedFallbackSrc] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const fallbackSrc = media?.src ? (media.src.startsWith('http') ? media.src : `${publicSiteOrigin}${media.src}`) : '';

  useEffect(() => {
    if (!media?.driveFileId) {
      return undefined;
    }

    const controller = new AbortController();
    let nextObjectUrl = '';

    fetch(getDriveFileDownloadUrl(media.driveFileId), {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Drive preview failed');
        }
        return response.blob();
      })
      .then((blob) => {
        nextObjectUrl = URL.createObjectURL(blob);
        setPreview({ fileId: media.driveFileId ?? '', objectUrl: nextObjectUrl, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPreview({ fileId: media.driveFileId ?? '', objectUrl: '', failed: true });
        }
      });

    return () => {
      controller.abort();
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [accessToken, media?.driveFileId, retryKey]);

  const drivePreview = media?.driveFileId && preview?.fileId === media.driveFileId ? preview : null;
  const fallbackFailed = Boolean(fallbackSrc && failedFallbackSrc === fallbackSrc);
  const src = drivePreview?.objectUrl || (fallbackFailed ? '' : fallbackSrc);
  const failed = Boolean(drivePreview?.failed && (!fallbackSrc || fallbackFailed));
  const isLoadingDrive = Boolean(media?.driveFileId && !drivePreview);
  const isShowingDrive = Boolean(drivePreview?.objectUrl);
  const isShowingFallbackAfterDriveFailure = Boolean(drivePreview?.failed && src && !isShowingDrive);
  const driveFileUrl = media?.driveFileId ? getDriveFileViewUrl(media.driveFileId) : null;
  const sourceIdLabel = media?.driveFileId ? shortSourceId(media.driveFileId) : media?.src ? 'קובץ אתר' : 'אין מקור';
  const statusLabel = isShowingDrive
    ? 'מקור בדרייב'
    : isShowingFallbackAfterDriveFailure
      ? 'Drive לא נטען - מוצג מהאתר'
      : media?.driveFileId
        ? 'טוען מדרייב'
        : 'תצוגה מהאתר';

  return (
    <div className="media-preview">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => {
            if (drivePreview?.objectUrl && fallbackSrc) {
              setPreview(media?.driveFileId ? { fileId: media.driveFileId, objectUrl: '', failed: true } : null);
              return;
            }
            setFailedFallbackSrc(fallbackSrc);
            setPreview(media?.driveFileId ? { fileId: media.driveFileId, objectUrl: '', failed: true } : null);
          }}
        />
      ) : (
        <div className="empty-preview">
          {isLoadingDrive ? <RefreshCw aria-hidden="true" /> : <Eye aria-hidden="true" />}
          <span>
            {media
              ? isLoadingDrive
                ? 'טוען תצוגה מקדימה ישירות מדרייב...'
                : 'אין תצוגה מקדימה. בחרו מקור מדרייב או פרסמו את התמונה לאתר.'
              : 'לא נבחרה תמונה'}
          </span>
        </div>
      )}
      {media && showActions && (
        <div className="preview-source-bar">
          <span className={isShowingDrive ? 'source-pill is-drive' : isShowingFallbackAfterDriveFailure ? 'source-pill is-warning' : 'source-pill'}>
            {statusLabel}
          </span>
          <span className={media.driveFileId ? 'source-pill is-source-id' : 'source-pill'}>{sourceIdLabel}</span>
          {driveFileUrl && (
            <a className="preview-drive-link" href={driveFileUrl} target="_blank" rel="noreferrer" title="פתיחת קובץ המקור ב-Google Drive">
              <ExternalLink aria-hidden="true" />
              Drive
            </a>
          )}
          {drivePreview?.failed && media.driveFileId && (
            <button
              type="button"
              className="preview-retry-button"
              onClick={() => {
                setPreview(null);
                setRetryKey((current) => current + 1);
              }}
            >
              <RefreshCw aria-hidden="true" />
              נסה שוב
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const CopyOnlySectionPreview = ({
  section,
  tagsSection,
  device,
}: {
  readonly section: SectionBlockRecord;
  readonly tagsSection?: SectionBlockRecord;
  readonly device: PreviewDevice;
}) => (
  <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
    <PreviewBrowserBar device={device} />
    <div className="site-section-preview site-section-preview-frame copy-only-section-preview">
      <p className="kicker">{section.items[0] || section.title}</p>
      <h3>{section.title}</h3>
      <div className="copy-only-preview-text">
        {section.text?.split('|').filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      {tagsSection && (
        <div className="preview-mini-tags">
          {tagsSection.items.map((item) => <span key={item}>{item}</span>)}
        </div>
      )}
    </div>
  </div>
);

export const ItemActions = ({
  isArchived,
  onDuplicate,
  onArchive,
  onRestore,
}: {
  readonly isArchived: boolean;
  readonly onDuplicate?: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
}) => (
  <div className="item-actions">
    {isArchived ? (
      <button type="button" className="icon-button" onClick={onRestore} aria-label="שחזור מהארכיון">
        <RotateCcw aria-hidden="true" />
      </button>
    ) : (
      <>
        {onDuplicate && (
          <button type="button" className="icon-button" onClick={onDuplicate} aria-label="שכפול">
            <Copy aria-hidden="true" />
          </button>
        )}
        <button type="button" className="icon-button danger" onClick={onArchive} aria-label="העברה לארכיון">
          <Trash2 aria-hidden="true" />
        </button>
      </>
    )}
  </div>
);
