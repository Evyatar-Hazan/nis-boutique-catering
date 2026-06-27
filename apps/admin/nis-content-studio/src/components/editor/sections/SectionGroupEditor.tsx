import { FileText, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ContentSnapshot, ImageAssetRecord, SectionBlockRecord } from '@monorepo/content-schema';
import { EditorCard } from '../EditorCard';
import { EditorSplitLayout } from '../EditorSplitLayout';
import { Field } from '../Field';
import { PanelHeader } from '../PanelHeader';
import { PreviewHeader } from '../PreviewHeader';
import { TextInput } from '../TextInput';
import { Toggle } from '../Toggle';
import type { PreviewDevice } from '../types';

type SectionGroupEditorProps = {
  readonly title: string;
  readonly text: string;
  readonly group: string;
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly sections: readonly SectionBlockRecord[];
  readonly updateSection: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly addSection: (group?: string) => void;
  readonly duplicateSection: (section: SectionBlockRecord) => void;
  readonly archiveSection: (id: string) => void;
  readonly restoreSection: (id: string) => void;
  readonly previewDevice: PreviewDevice;
  readonly onPreviewDeviceChange: (device: PreviewDevice) => void;
  readonly sectionGroupLabels: Readonly<Record<string, string>>;
  readonly joinPipeList: (items: readonly string[]) => string;
  readonly splitPipeList: (value: string) => string[];
  readonly renderItemActions: (args: {
    readonly section: SectionBlockRecord;
    readonly onDuplicate: () => void;
    readonly onArchive: () => void;
    readonly onRestore: () => void;
  }) => ReactNode;
  readonly renderPreview: (args: {
    readonly group: string;
    readonly title: string;
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly sections: readonly SectionBlockRecord[];
    readonly allSections: readonly SectionBlockRecord[];
    readonly device: PreviewDevice;
  }) => ReactNode;
};

export const SectionGroupEditor = ({
  title,
  text,
  group,
  content,
  mediaById,
  sections,
  updateSection,
  addSection,
  duplicateSection,
  archiveSection,
  restoreSection,
  previewDevice,
  onPreviewDeviceChange,
  sectionGroupLabels,
  joinPipeList,
  splitPipeList,
  renderItemActions,
  renderPreview,
}: SectionGroupEditorProps) => {
  const groupSections = sections
    .filter((section) => section.group === group)
    .sort((left, right) => left.order - right.order);

  return (
    <EditorSplitLayout
      editor={
        <>
        <PanelHeader
          title={title}
          text={text}
          action={
            <button className="compact-button" onClick={() => addSection(group)}>
              <Plus aria-hidden="true" />
              הוסף פריט
            </button>
          }
        />
        <div className="cards-list">
          {groupSections.map((section) => (
            <EditorCard
              key={section.id}
              archived={Boolean(section.deletedAt)}
              kicker={sectionGroupLabels[section.group] ?? section.group}
              title={section.title || 'פריט ללא כותרת'}
              actions={renderItemActions({
                section,
                onDuplicate: () => duplicateSection(section),
                onArchive: () => archiveSection(section.id),
                onRestore: () => restoreSection(section.id),
              })}
            >
              <Toggle checked={section.active && !section.deletedAt} label="מוצג באתר" onChange={(checked) => updateSection(section.id, { active: checked })} />
              <Field
                label={group === 'site-microcopy' ? 'שם פנימי ברור' : group === 'faq' ? 'השאלה שמופיעה באתר' : 'כותרת שמופיעה באתר'}
                help={group === 'site-microcopy' ? 'שם שעוזר להבין איפה הטקסט מופיע. בדרך כלל לא מוצג באתר.' : group === 'site-copy' ? 'זו הכותרת הגדולה של האזור באתר.' : 'זו הכותרת שהלקוח יראה באזור הזה.'}
              >
                <TextInput value={section.title ?? ''} onChange={(value) => updateSection(section.id, { title: value || undefined })} />
              </Field>
              <Field
                label={group === 'site-microcopy' ? 'הטקסט שמופיע באתר' : group === 'faq' ? 'התשובה' : 'טקסט מתחת לכותרת'}
                help={group === 'site-microcopy' ? 'זה הטקסט הקצר שהלקוח יראה בכפתור, בטופס או בהודעת וואטסאפ.' : group === 'site-copy' ? 'הפתיח או פסקת ההסבר של האזור. אפשר להשאיר ריק אם באזור אין פסקה.' : 'טקסט קצר וברור, בלי ניסוחים טכניים.'}
              >
                <textarea value={section.text ?? ''} onChange={(event) => updateSection(section.id, { text: event.target.value || undefined })} />
              </Field>
              <Field
                label={group === 'site-copy' ? 'תווית קטנה ועוד פסקאות' : group === 'site-microcopy' ? 'אפשרויות לרשימות קצרות' : 'נקודות נוספות'}
                help={group === 'site-copy' ? 'הנקודה הראשונה היא התווית שמעל הכותרת. נקודה שנייה יכולה להכיל עוד פסקאות, מופרדות עם |.' : group === 'site-microcopy' ? 'משמש לשדות בחירה כמו סוג הזמנה או אופן קבלה. מפרידים אפשרויות עם |.' : 'אם צריך רשימה קצרה, מפרידים נקודות עם |'}
              >
                <TextInput value={joinPipeList(section.items)} onChange={(value) => updateSection(section.id, { items: splitPipeList(value) })} />
              </Field>
              <details className="technical-details">
                <summary>פרטים מתקדמים</summary>
                <div className="inline-grid">
                  <input type="number" value={section.order} min={0} onChange={(event) => updateSection(section.id, { order: Number(event.target.value) })} />
                  <TextInput value={section.id} onChange={(value) => updateSection(section.id, { id: value })} />
                </div>
              </details>
            </EditorCard>
          ))}
          {groupSections.length === 0 && (
            <div className="empty-state">
              <FileText aria-hidden="true" />
              <strong>עדיין אין פריטים באזור הזה</strong>
              <span>לחצו “הוסף פריט” כדי להתחיל לנהל אותו מהסטודיו.</span>
            </div>
          )}
        </div>
        </>
      }
      preview={
        <>
        <PreviewHeader
          title="תצוגה מקדימה כמו באתר"
          text="אפשר לעבור בין מחשב למובייל ולבדוק איך הטקסטים ייראו אחרי פרסום."
          device={previewDevice}
          onDeviceChange={onPreviewDeviceChange}
        />
        {renderPreview({
          group,
          title,
          content,
          mediaById,
          sections: groupSections,
          allSections: sections,
          device: previewDevice,
        })}
        </>
      }
    />
  );
};
