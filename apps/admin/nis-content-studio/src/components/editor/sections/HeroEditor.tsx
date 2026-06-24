import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ContentSnapshot, ImageAssetRecord, SectionBlockRecord } from '@monorepo/content-schema';
import { Field } from '../Field';
import { PanelHeader } from '../PanelHeader';
import { PreviewHeader } from '../PreviewHeader';
import { TextInput } from '../TextInput';
import { Toggle } from '../Toggle';

type PreviewDevice = 'desktop' | 'mobile';
type MediaUsageKind = 'gallery' | 'service' | 'hero' | 'manifesto';

type HeroMediaSlot = {
  readonly key: string;
  readonly label: string;
  readonly help: string;
  readonly fallbackMediaId: string;
};

type HeroEditorProps = {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly previewDevice: PreviewDevice;
  readonly onPreviewDeviceChange: (device: PreviewDevice) => void;
  readonly updateSection: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly addSection: (group?: string) => void;
  readonly persistHeroStats: () => void;
  readonly heroMediaSlots: readonly HeroMediaSlot[];
  readonly patchSectionItem: (section: SectionBlockRecord, index: number, value: string, fallback: string) => Partial<SectionBlockRecord>;
  readonly heroMediaIdAt: (heroMedia: SectionBlockRecord | undefined, index: number) => string;
  readonly patchHeroMediaId: (heroMedia: SectionBlockRecord, index: number, mediaId: string) => Partial<SectionBlockRecord>;
  readonly mediaLabel: (media: ImageAssetRecord, content: ContentSnapshot) => string;
  readonly renderPreview: (args: {
    readonly content: ContentSnapshot;
    readonly hero: SectionBlockRecord;
    readonly device: PreviewDevice;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  }) => ReactNode;
  readonly renderMediaQuickPicker: (args: {
    readonly label: string;
    readonly mediaItems: readonly ImageAssetRecord[];
    readonly selectedMediaId: string;
    readonly content: ContentSnapshot;
    readonly onSelect: (mediaId: string) => void;
  }) => ReactNode;
  readonly renderMediaSelectionUsageNotice: (args: {
    readonly mediaId: string;
    readonly content: ContentSnapshot;
    readonly currentUsage: { readonly kind: MediaUsageKind; readonly id: string };
  }) => ReactNode;
  readonly joinPipeList: (items: readonly string[]) => string;
  readonly splitPipeList: (value: string) => string[];
};

export const HeroEditor = ({
  content,
  mediaById,
  previewDevice,
  onPreviewDeviceChange,
  updateSection,
  addSection,
  persistHeroStats,
  heroMediaSlots,
  patchSectionItem,
  heroMediaIdAt,
  patchHeroMediaId,
  mediaLabel,
  renderPreview,
  renderMediaQuickPicker,
  renderMediaSelectionUsageNotice,
  joinPipeList,
  splitPipeList,
}: HeroEditorProps) => {
  const hero = content.sections.find((section) => section.id === 'hero') ?? content.sections.find((section) => section.group === 'hero');
  const heroBadges = content.sections.find((section) => section.id === 'hero-badges');
  const heroMedia = content.sections.find((section) => section.id === 'hero-media');
  const heroStats = content.sections
    .filter((section) => section.group === 'hero-stats')
    .sort((left, right) => left.order - right.order);
  const visibleMedia = content.media.filter((media) => !media.deletedAt);

  if (!hero) {
    return (
      <section className="workspace-panel">
        <PanelHeader title="מסך פתיחה" text="עדיין אין רשומת Hero ב-Sheets." />
        <button className="compact-button" onClick={() => addSection('hero')}>
          <Plus aria-hidden="true" />
          צור מסך פתיחה
        </button>
      </section>
    );
  }

  return (
    <section className="workspace-panel split-editor split-editor-priority-preview">
      <div className="preview-column preview-column-full-width">
        <PreviewHeader
          title="תצוגה מקדימה כמו באתר"
          text="אפשר לעבור בין מחשב למובייל ולראות איך מסך הפתיחה ירגיש ללקוח."
          device={previewDevice}
          onDeviceChange={onPreviewDeviceChange}
        />
        {renderPreview({ content, hero, device: previewDevice, mediaById })}
      </div>
      <div className="editor-column editor-column-sections">
        <PanelHeader title="מסך פתיחה" text="כאן עורכים את המסר הראשון שהלקוח פוגש. כל אזור מחולק לפי המשמעות שלו באתר." />
        <div className="hero-editor-status-card">
          <div className="hero-editor-status-copy">
            <strong>מצב המסך</strong>
            <span>הדליקו או כבו את מסך הפתיחה, ואז ערכו רק את הקבוצה שאתם צריכים.</span>
          </div>
          <Toggle checked={hero.active && !hero.deletedAt} label="מסך הפתיחה פעיל" onChange={(checked) => updateSection(hero.id, { active: checked })} />
        </div>

        <details className="editor-section-card" open>
          <summary>
            <div>
              <strong>כותרת וטקסט ראשי</strong>
              <span>המסר העליון, הכותרת הגדולה והטקסט שמסביר את ההבטחה.</span>
            </div>
          </summary>
          <div className="editor-section-body">
            <Field label="טקסט קטן מעל הכותרת" help="מופיע מעל הכותרת הגדולה, ליד הקו הזהוב.">
              <TextInput
                value={hero.items[0] ?? ''}
                onChange={(value) => updateSection(hero.id, patchSectionItem(hero, 0, value, 'מהרובע היהודי לביתר עילית'))}
              />
            </Field>
            <Field label="כותרת גדולה" help="מופיעה במרכז המסך הראשון. אפשר לרדת שורה עם Enter.">
              <textarea value={hero.title ?? ''} onChange={(event) => updateSection(hero.id, { title: event.target.value || undefined })} />
            </Field>
            <Field label="משפט מודגש מתחת לכותרת" help="זה המשפט שבולט מיד מתחת לכותרת.">
              <textarea
                value={hero.items[1] ?? ''}
                onChange={(event) => updateSection(hero.id, patchSectionItem(hero, 1, event.target.value, 'שבתות, מגשי אירוח ו־Travel Nis, עם אוכל מוקפד, נראות יפה ושיחה קצרה שסוגרת כיוון.'))}
              />
            </Field>
            <Field label="פסקת הסבר קצרה" help="הטקסט הקטן שמתחת למשפט המודגש.">
              <textarea value={hero.text ?? ''} onChange={(event) => updateSection(hero.id, { text: event.target.value || undefined })} />
            </Field>
          </div>
        </details>

        {heroBadges && (
          <details className="editor-section-card" open>
            <summary>
              <div>
                <strong>תגיות קצרות</strong>
                <span>הצ'יפים הקטנים שמופיעים מתחת לכפתורים ומחזקים את ההצעה.</span>
              </div>
            </summary>
            <div className="editor-section-body">
              <Field label="תגיות קצרות" help="מפרידים עם | לדוגמה: שבתות | מגשי אירוח | Travel Nis">
                <TextInput value={joinPipeList(heroBadges.items)} onChange={(value) => updateSection(heroBadges.id, { items: splitPipeList(value) })} />
              </Field>
            </div>
          </details>
        )}

        {heroMedia && (
          <details className="editor-section-card hero-media-editor" open>
            <summary>
              <div>
                <strong>תמונות מסך פתיחה</strong>
                <span>הרקע והתמונות שבונות את התחושה הוויזואלית של המסך הראשון.</span>
              </div>
            </summary>
            <div className="editor-section-body">
              {heroMediaSlots.map((slot, index) => {
                const selectedMediaId = heroMediaIdAt(heroMedia, index);
                return (
                  <Field key={slot.key} label={slot.label} help={slot.help}>
                    <select value={selectedMediaId} onChange={(event) => updateSection(heroMedia.id, patchHeroMediaId(heroMedia, index, event.target.value))}>
                      {visibleMedia.map((media) => <option key={media.id} value={media.id}>{mediaLabel(media, content)}</option>)}
                    </select>
                    {renderMediaQuickPicker({
                      label: `בחירה מהירה - ${slot.label}`,
                      mediaItems: visibleMedia,
                      selectedMediaId,
                      content,
                      onSelect: (mediaId) => updateSection(heroMedia.id, patchHeroMediaId(heroMedia, index, mediaId)),
                    })}
                    {renderMediaSelectionUsageNotice({
                      mediaId: selectedMediaId,
                      content,
                      currentUsage: { kind: 'hero', id: slot.key },
                    })}
                  </Field>
                );
              })}
            </div>
          </details>
        )}

        {heroStats.length > 0 && (
          <details className="editor-section-card editor-section-card-advanced" open>
            <summary>
              <div>
                <strong>נתוני אירוח שמופיעים במסך</strong>
                <span>הכרטיסים הקצרים שמופיעים בתוך מסך הפתיחה עצמו, מתחת לתגיות.</span>
              </div>
            </summary>
            <div className="editor-section-body">
              <div className="nested-editor-list">
                {heroStats.map((stat) => (
                  <article key={stat.id}>
                    <Field label="ערך קצר" help="לדוגמה: שבתות, אירוח קטן, Travel Nis.">
                      <TextInput
                        value={stat.title ?? ''}
                        onChange={(value) => updateSection(stat.id, { title: value || undefined })}
                        onBlur={persistHeroStats}
                      />
                    </Field>
                    <Field label="הסבר קצר" help="משפט שמסביר את הערך.">
                      <TextInput
                        value={stat.text ?? ''}
                        onChange={(value) => updateSection(stat.id, { text: value || undefined })}
                        onBlur={persistHeroStats}
                      />
                    </Field>
                  </article>
                ))}
              </div>
              <div className="hero-stats-live-preview" aria-label="תצוגה חיה של נתוני האירוח">
                {heroStats.map((stat) => (
                  <article key={`${stat.id}-preview`} className="hero-stats-live-card">
                    <strong>{stat.title || 'ערך קצר'}</strong>
                    <span>{stat.text || 'הסבר קצר שיופיע בתוך מסך הפתיחה.'}</span>
                  </article>
                ))}
              </div>
            </div>
          </details>
        )}
      </div>
    </section>
  );
};
