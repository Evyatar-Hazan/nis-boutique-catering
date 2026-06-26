import type { ReactNode } from 'react';
import type { ContentSnapshot, ImageAssetRecord, SectionBlockRecord } from '@monorepo/content-schema';
import { EditorSplitLayout } from '../EditorSplitLayout';
import { Field } from '../Field';
import { PanelHeader } from '../PanelHeader';
import { PreviewHeader } from '../PreviewHeader';
import { SectionCopyFields } from './SectionCopyFields';
import { TextInput } from '../TextInput';
import { Toggle } from '../Toggle';
import type { PreviewDevice } from '../types';

type CopyOnlySectionEditorProps = {
  readonly content: ContentSnapshot;
  readonly sectionId: string;
  readonly title: string;
  readonly text: string;
  readonly previewDevice: PreviewDevice;
  readonly onPreviewDeviceChange: (device: PreviewDevice) => void;
  readonly updateSection: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly tagsSection?: SectionBlockRecord;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly getManagedCopySection: (content: ContentSnapshot, id: string) => SectionBlockRecord | undefined;
  readonly patchSectionItem: (section: SectionBlockRecord, index: number, value: string, fallback: string) => Partial<SectionBlockRecord>;
  readonly joinPipeList: (items: readonly string[]) => string;
  readonly splitPipeList: (value: string) => string[];
  readonly renderExactPreview: (args: {
    readonly sectionId: string;
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly device: PreviewDevice;
  }) => ReactNode | null;
  readonly renderFallbackPreview: (args: {
    readonly section: SectionBlockRecord;
    readonly tagsSection?: SectionBlockRecord;
    readonly device: PreviewDevice;
  }) => ReactNode;
};

export const CopyOnlySectionEditor = ({
  content,
  sectionId,
  title,
  text,
  previewDevice,
  onPreviewDeviceChange,
  updateSection,
  tagsSection,
  mediaById,
  getManagedCopySection,
  patchSectionItem,
  joinPipeList,
  splitPipeList,
  renderExactPreview,
  renderFallbackPreview,
}: CopyOnlySectionEditorProps) => {
  const section = getManagedCopySection(content, sectionId);

  if (!section) {
    return (
      <section className="workspace-panel">
        <PanelHeader title={title} text="האזור הזה עדיין לא קיים ב-Sheets. רענון מה-Sheets יוסיף ברירות מחדל אם הן חסרות." />
      </section>
    );
  }

  const exactPreview = renderExactPreview({ sectionId, content, mediaById, device: previewDevice });

  return (
    <EditorSplitLayout
      editor={
        <>
        <PanelHeader title={title} text={text} />
        <Toggle checked={section.active && !section.deletedAt} label="האזור מוצג באתר" onChange={(checked) => updateSection(section.id, { active: checked })} />
        <SectionCopyFields
          section={section}
          onUpdate={updateSection}
          patchSectionItem={patchSectionItem}
          eyebrowFallback={title}
          eyebrowLabel="תווית קטנה מעל הכותרת"
          eyebrowHelp="מופיעה מעל הכותרת של האזור באתר."
          titleLabel="כותרת האזור"
          titleHelp="הכותרת הגדולה שמופיעה באתר."
          textLabel="טקסט הסבר"
          textHelp="אפשר להשתמש ב-| כדי לחלק לפסקאות באתר."
        />
        {tagsSection && (
          <Field label="תגיות תחומי שירות" help="מופיע באזור SEO באתר כתגיות קצרות. מפרידים עם |">
            <TextInput value={joinPipeList(tagsSection.items)} onChange={(value) => updateSection(tagsSection.id, { items: splitPipeList(value) })} />
          </Field>
        )}
        </>
      }
      preview={
        <>
        <PreviewHeader
          title="תצוגה מקדימה כמו באתר"
          text="האזור הזה צריך להישאר קצר וברור בדסקטופ ובמובייל."
          device={previewDevice}
          onDeviceChange={onPreviewDeviceChange}
        />
        {exactPreview ?? renderFallbackPreview({ section, tagsSection, device: previewDevice })}
        </>
      }
    />
  );
};
