import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ContentSnapshot, ImageAssetRecord, SectionBlockRecord } from '@monorepo/content-schema';
import { EditorSplitLayout } from '../EditorSplitLayout';
import { PanelHeader } from '../PanelHeader';
import { PreviewHeader } from '../PreviewHeader';
import { SectionCopyFields } from './SectionCopyFields';
import { Toggle } from '../Toggle';
import type { PreviewDevice } from '../types';

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
    <EditorSplitLayout
      editor={
        <>
        <PanelHeader
          title="רעיון אחד ברור"
          text="זה הפתיח הקצר שאחרי מסך הפתיחה. הוא מיועד להסביר במהירות למי Nis מתאימה ולמה שבתות, אירוח קטן ו-Travel Nis הם אותו עולם."
        />
        <Toggle checked={section.active && !section.deletedAt} label="האזור מוצג באתר" onChange={(checked) => updateSection(section.id, { active: checked })} />
        <SectionCopyFields
          section={section}
          onUpdate={updateSection}
          patchSectionItem={patchSectionItem}
          eyebrowFallback="רעיון אחד ברור"
          eyebrowLabel="תווית קטנה מעל הכותרת"
          eyebrowHelp="לדוגמה: רעיון אחד ברור."
          titleLabel="כותרת האזור"
          titleHelp="משפט אחד שמחדד את ההבטחה של Nis."
          textLabel="טקסט הסבר"
          textHelp="פסקה קצרה שמסבירה למי האזור מיועד ולמה הוא חשוב."
        />
        </>
      }
      preview={
        <>
        <PreviewHeader
          title="תצוגה מקדימה כמו באתר"
          text="האזור הזה אמור להיות קצר, ברור וללא גלילה בדסקטופ."
          device={previewDevice}
          onDeviceChange={onPreviewDeviceChange}
        />
        {renderPreview({ content, mediaById, device: previewDevice })}
        </>
      }
    />
  );
};
