import type { ReactNode } from 'react';
import type { ContentSnapshot } from '@monorepo/content-schema';
import type { PreviewDevice } from '../types';

type SiteCopyOverviewPreviewProps = {
  readonly content: ContentSnapshot;
  readonly device: PreviewDevice;
  readonly sectionGroupLabels: Readonly<Record<string, string>>;
  readonly renderBrowserBar: (device: PreviewDevice) => ReactNode;
};

export const SiteCopyOverviewPreview = ({
  content,
  device,
  sectionGroupLabels,
  renderBrowserBar,
}: SiteCopyOverviewPreviewProps) => {
  const sections = content.sections
    .filter((section) => section.group === 'site-copy' && section.active && !section.deletedAt)
    .sort((left, right) => left.order - right.order)
    .slice(0, device === 'mobile' ? 4 : 6);

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      {renderBrowserBar(device)}
      <div className="site-section-preview site-section-preview-frame site-copy-overview-preview">
        <p className="kicker">טקסטי מעטפת</p>
        <h3>כותרות הפתיחה שמחזיקות את כל האזורים באתר.</h3>
        <p>כך נראות כותרות, תוויות ופסקאות פתיחה של כמה אזורים מרכזיים, כדי לראות אם השפה הכללית של האתר נשארת עקבית.</p>
        <div className="site-copy-overview-grid">
          {sections.map((section) => (
            <article key={section.id}>
              <span>{section.items[0] || sectionGroupLabels[section.id.replace(/^copy-/, '')] || 'אזור באתר'}</span>
              <strong>{section.title}</strong>
              {section.text && <p>{section.text}</p>}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

type SiteMicrocopyOverviewPreviewProps = {
  readonly content: ContentSnapshot;
  readonly device: PreviewDevice;
  readonly renderBrowserBar: (device: PreviewDevice) => ReactNode;
  readonly getPreviewMicrocopy: (content: ContentSnapshot, id: string, fallback: string) => string;
};

export const SiteMicrocopyOverviewPreview = ({
  content,
  device,
  renderBrowserBar,
  getPreviewMicrocopy,
}: SiteMicrocopyOverviewPreviewProps) => {
  const topbarWhatsapp = getPreviewMicrocopy(content, 'topbar-whatsapp-label', 'וואטסאפ');
  const heroPrimary = getPreviewMicrocopy(content, 'hero-primary-cta', 'דברו איתנו בוואטסאפ');
  const heroSecondary = getPreviewMicrocopy(content, 'hero-secondary-cta', 'ראו איך זה נראה');
  const floatingWhatsapp = getPreviewMicrocopy(content, 'floating-whatsapp-aria', 'דברו איתנו בוואטסאפ');
  const formLabels = [
    getPreviewMicrocopy(content, 'form-name-label', 'שם מלא'),
    getPreviewMicrocopy(content, 'form-phone-label', 'טלפון'),
    getPreviewMicrocopy(content, 'form-interest-label', 'במה אתם מתעניינים?'),
    getPreviewMicrocopy(content, 'form-submit-label', 'שלחו פנייה בוואטסאפ'),
  ];

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      {renderBrowserBar(device)}
      <div className="site-section-preview site-section-preview-frame site-microcopy-overview-preview">
        <p className="kicker">טקסטים קטנים</p>
        <h3>כפתורים, תפריטים והודעות קצרות שהלקוח ממש לוחץ עליהן.</h3>
        <p>התצוגה כאן לא מחליפה את כל האתר, אבל כן מראה איך אותם טקסטים נראים בתוך UI אמיתי: תפריט, CTA וטופס.</p>
        <div className="microcopy-preview-topbar">
          <span>nis</span>
          <button type="button">{topbarWhatsapp}</button>
        </div>
        <div className="microcopy-preview-actions">
          <button type="button" className="microcopy-primary-action">{heroPrimary}</button>
          <button type="button" className="microcopy-secondary-action">{heroSecondary}</button>
          <span>{floatingWhatsapp}</span>
        </div>
        <div className="microcopy-preview-form">
          {formLabels.slice(0, device === 'mobile' ? 3 : 4).map((label) => (
            <label key={label}>
              <span>{label}</span>
              <input type="text" value="" readOnly aria-label={label} />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
