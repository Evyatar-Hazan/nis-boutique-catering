import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ContentSnapshot, ImageAssetRecord, SectionBlockRecord } from '@monorepo/content-schema';
import { EditorSplitLayout } from '../EditorSplitLayout';
import { Field } from '../Field';
import { PanelHeader } from '../PanelHeader';
import { PreviewHeader } from '../PreviewHeader';
import { TextInput } from '../TextInput';
import { Toggle } from '../Toggle';
import type { MediaUsageKind, PreviewDevice } from '../types';

type ManifestoEditorProps = {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly updateSection: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly addSection: (group?: string) => void;
  readonly duplicateSection: (section: SectionBlockRecord) => void;
  readonly archiveSection: (id: string) => void;
  readonly restoreSection: (id: string) => void;
  readonly previewDevice: PreviewDevice;
  readonly onPreviewDeviceChange: (device: PreviewDevice) => void;
  readonly manifestoMediaFallbacks: readonly string[];
  readonly patchSectionItem: (section: SectionBlockRecord, index: number, value: string, fallback: string) => Partial<SectionBlockRecord>;
  readonly mediaLabel: (media: ImageAssetRecord, content: ContentSnapshot) => string;
  readonly renderPreview: (args: {
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly device: PreviewDevice;
  }) => ReactNode;
  readonly renderItemActions: (args: {
    readonly section: SectionBlockRecord;
    readonly onDuplicate: () => void;
    readonly onArchive: () => void;
    readonly onRestore: () => void;
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
};

export const ManifestoEditor = ({
  content,
  mediaById,
  updateSection,
  addSection,
  duplicateSection,
  archiveSection,
  restoreSection,
  previewDevice,
  onPreviewDeviceChange,
  manifestoMediaFallbacks,
  patchSectionItem,
  mediaLabel,
  renderPreview,
  renderItemActions,
  renderMediaQuickPicker,
  renderMediaSelectionUsageNotice,
}: ManifestoEditorProps) => {
  const copy = content.sections.find((section) => section.id === 'manifesto' && section.group === 'site-copy');
  const moments = content.sections
    .filter((section) => section.group === 'manifesto')
    .sort((left, right) => left.order - right.order);
  const visibleMedia = content.media.filter((media) => !media.deletedAt);

  return (
    <EditorSplitLayout
      editor={
        <>
        <PanelHeader
          title="השפה של Nis"
          text="האזור הזה מסביר את תחושת הבוטיק: נראות, ביתיות והתאמה אישית. כאן עורכים גם את הטקסט הראשי וגם את הכרטיסים שמרכזים את מסרי הבוטיק."
          action={
            <button className="compact-button" onClick={() => addSection('manifesto')}>
              <Plus aria-hidden="true" />
              הוסף כרטיס
            </button>
          }
        />
        {copy && (
          <div className="editor-group">
            <div className="editor-group-heading">
              <strong>כותרת האזור</strong>
              <span>החלק הימני באתר: תווית, כותרת גדולה ופסקת הסבר.</span>
            </div>
            <Toggle checked={copy.active && !copy.deletedAt} label="האזור מוצג באתר" onChange={(checked) => updateSection(copy.id, { active: checked })} />
            <Field label="תווית קטנה" help="לדוגמה: השפה של Nis.">
              <TextInput value={copy.items[0] ?? ''} onChange={(value) => updateSection(copy.id, patchSectionItem(copy, 0, value, 'השפה של Nis'))} />
            </Field>
            <Field label="כותרת גדולה" help="אפשר לרדת שורה עם Enter.">
              <textarea value={copy.title ?? ''} onChange={(event) => updateSection(copy.id, { title: event.target.value || undefined })} />
            </Field>
            <Field label="טקסט מתחת לכותרת" help="משפט קצר שמסביר את התחושה שהאזור אמור להעביר.">
              <textarea value={copy.text ?? ''} onChange={(event) => updateSection(copy.id, { text: event.target.value || undefined })} />
            </Field>
          </div>
        )}
        <div className="cards-list">
          {moments.map((moment, index) => {
            const selectedMediaId = moment.items[1] ?? manifestoMediaFallbacks[index % manifestoMediaFallbacks.length];
            return (
              <article className={moment.deletedAt ? 'edit-card is-archived' : 'edit-card'} key={moment.id}>
                <div className="card-heading">
                  <div>
                    <p className="kicker">כרטיס בשפה של Nis</p>
                    <h3>{moment.title || 'כרטיס ללא כותרת'}</h3>
                  </div>
                  {renderItemActions({
                    section: moment,
                    onDuplicate: () => duplicateSection(moment),
                    onArchive: () => archiveSection(moment.id),
                    onRestore: () => restoreSection(moment.id),
                  })}
                </div>
                <Toggle checked={moment.active && !moment.deletedAt} label="מוצג באתר" onChange={(checked) => updateSection(moment.id, { active: checked })} />
                <Field label="מספר/תווית בכרטיס" help="לדוגמה: 01, 02, 03.">
                  <TextInput value={moment.items[0] ?? ''} onChange={(value) => updateSection(moment.id, patchSectionItem(moment, 0, value, String(index + 1).padStart(2, '0')))} />
                </Field>
                <Field label="כותרת הכרטיס" help="הכותרת שמופיעה בתוך הכרטיס באתר.">
                  <textarea value={moment.title ?? ''} onChange={(event) => updateSection(moment.id, { title: event.target.value || undefined })} />
                </Field>
                <Field label="טקסט הכרטיס" help="הסבר קצר שמופיע מתחת לכותרת.">
                  <textarea value={moment.text ?? ''} onChange={(event) => updateSection(moment.id, { text: event.target.value || undefined })} />
                </Field>
                <Field label="תמונה לכרטיס" help="התמונה שמופיעה בצד הכרטיס באזור השפה של Nis.">
                  <select value={selectedMediaId} onChange={(event) => updateSection(moment.id, patchSectionItem(moment, 1, event.target.value, manifestoMediaFallbacks[index % manifestoMediaFallbacks.length]))}>
                    {visibleMedia.map((media) => <option key={media.id} value={media.id}>{mediaLabel(media, content)}</option>)}
                  </select>
                  {renderMediaQuickPicker({
                    label: 'בחירה מהירה לתמונה',
                    mediaItems: visibleMedia,
                    selectedMediaId,
                    content,
                    onSelect: (mediaId) => updateSection(moment.id, patchSectionItem(moment, 1, mediaId, manifestoMediaFallbacks[index % manifestoMediaFallbacks.length])),
                  })}
                  {renderMediaSelectionUsageNotice({
                    mediaId: selectedMediaId,
                    content,
                    currentUsage: { kind: 'manifesto', id: moment.id },
                  })}
                </Field>
              </article>
            );
          })}
        </div>
        </>
      }
      preview={
        <>
        <PreviewHeader
          title="תצוגה מקדימה כמו באתר"
          text="אפשר לעבור בין מחשב למובייל ולבדוק שהאזור נכנס נכון בלי חיתוך מיותר."
          device={previewDevice}
          onDeviceChange={onPreviewDeviceChange}
        />
        {renderPreview({ content, mediaById, device: previewDevice })}
        </>
      }
    />
  );
};
