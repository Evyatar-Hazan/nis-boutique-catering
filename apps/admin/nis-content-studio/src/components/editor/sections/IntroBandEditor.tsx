import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ContentSnapshot, ImageAssetRecord, SectionBlockRecord } from '@monorepo/content-schema';
import { Field } from '../Field';
import { PanelHeader } from '../PanelHeader';
import { PreviewHeader } from '../PreviewHeader';
import { TextInput } from '../TextInput';
import { Toggle } from '../Toggle';

type PreviewDevice = 'desktop' | 'mobile';

type IntroBandEditorProps = {
  readonly content: ContentSnapshot;
  readonly previewDevice: PreviewDevice;
  readonly onPreviewDeviceChange: (device: PreviewDevice) => void;
  readonly updateSection: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly addSection: (group?: string) => void;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly getManagedCopySection: (content: ContentSnapshot, id: string) => SectionBlockRecord | undefined;
  readonly patchSectionItem: (section: SectionBlockRecord, index: number, value: string, fallback: string) => Partial<SectionBlockRecord>;
  readonly renderPreview: (args: {
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly device: PreviewDevice;
  }) => ReactNode;
};

export const IntroBandEditor = ({
  content,
  previewDevice,
  onPreviewDeviceChange,
  updateSection,
  addSection,
  mediaById,
  getManagedCopySection,
  patchSectionItem,
  renderPreview,
}: IntroBandEditorProps) => {
  const section = getManagedCopySection(content, 'intro-band');

  if (!section) {
    return (
      <section className="workspace-panel">
        <PanelHeader title="רעיון אחד ברור" text="האזור הזה עדיין לא קיים ב-Sheets." />
        <button className="compact-button" onClick={() => addSection('site-copy')}>
          <Plus aria-hidden="true" />
          צור אזור פתיח
        </button>
      </section>
    );
  }

  return (
    <section className="workspace-panel split-editor">
      <div className="editor-column">
        <PanelHeader
          title="רעיון אחד ברור"
          text="זה הפתיח הקצר שאחרי מסך הפתיחה. הוא מיועד להסביר במהירות למי Nis מתאימה ולמה שבתות, אירוח קטן ו-Travel Nis הם אותו עולם."
        />
        <Toggle checked={section.active && !section.deletedAt} label="האזור מוצג באתר" onChange={(checked) => updateSection(section.id, { active: checked })} />
        <Field label="תווית קטנה מעל הכותרת" help="לדוגמה: רעיון אחד ברור.">
          <TextInput value={section.items[0] ?? ''} onChange={(value) => updateSection(section.id, patchSectionItem(section, 0, value, 'רעיון אחד ברור'))} />
        </Field>
        <Field label="כותרת האזור" help="משפט אחד שמחדד את ההבטחה של Nis.">
          <textarea value={section.title ?? ''} onChange={(event) => updateSection(section.id, { title: event.target.value || undefined })} />
        </Field>
        <Field label="טקסט הסבר" help="פסקה קצרה שמסבירה למי האזור מיועד ולמה הוא חשוב.">
          <textarea value={section.text ?? ''} onChange={(event) => updateSection(section.id, { text: event.target.value || undefined })} />
        </Field>
      </div>
      <div className="preview-column">
        <PreviewHeader
          title="תצוגה מקדימה כמו באתר"
          text="האזור הזה אמור להיות קצר, ברור וללא גלילה בדסקטופ."
          device={previewDevice}
          onDeviceChange={onPreviewDeviceChange}
        />
        {renderPreview({ content, mediaById, device: previewDevice })}
      </div>
    </section>
  );
};
