import type { ContentSnapshot, ImageAssetRecord, ServiceRecord } from '@monorepo/content-schema';
import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { MediaQuickPicker, MediaSelectionUsageNotice } from '../../../mediaSelectionComponents';
import type { MediaUsageKind } from '../types';
import { Field } from '../Field';
import { PanelHeader } from '../PanelHeader';
import { TextInput } from '../TextInput';
import { Toggle } from '../Toggle';

type ServicesWorkspaceProps = {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly visibleMedia: readonly ImageAssetRecord[];
  readonly addService: () => void;
  readonly updateService: (id: string, patch: Partial<ServiceRecord>) => void;
  readonly duplicateService: (service: ServiceRecord) => void;
  readonly archiveService: (id: string) => void;
  readonly restoreService: (id: string) => void;
  readonly joinPipeList: (items: readonly string[]) => string;
  readonly splitPipeList: (value: string) => string[];
  readonly getMediaLabel: (media: ImageAssetRecord, content: ContentSnapshot) => string;
  readonly getMediaSrc: (media: ImageAssetRecord) => string;
  readonly getUsageKindLabel: (kind: MediaUsageKind) => string;
  readonly getOtherUsages: (mediaId: string, serviceId: string) => readonly {
    readonly kind: MediaUsageKind;
    readonly id: string;
    readonly title: string;
    readonly active: boolean;
  }[];
  readonly renderPreviewImage: (media: ImageAssetRecord | undefined) => ReactNode;
  readonly renderItemActions: (args: {
    readonly isArchived: boolean;
    readonly onDuplicate: () => void;
    readonly onArchive: () => void;
    readonly onRestore: () => void;
  }) => ReactNode;
  readonly renderNumberInput: (value: number, onChange: (value: number) => void) => ReactNode;
  readonly preview: ReactNode;
};

export const ServicesWorkspace = ({
  content,
  mediaById,
  visibleMedia,
  addService,
  updateService,
  duplicateService,
  archiveService,
  restoreService,
  joinPipeList,
  splitPipeList,
  getMediaLabel,
  getMediaSrc,
  getUsageKindLabel,
  getOtherUsages,
  renderPreviewImage,
  renderItemActions,
  renderNumberInput,
  preview,
}: ServicesWorkspaceProps) => (
  <section className="workspace-panel split-editor">
    <div className="editor-column">
      <PanelHeader
        title="חוויות אירוח"
        text="הנתונים כאן מזינים את Experience Lab באתר. גם הכיוונים לדוגמה התמזגו לתוך האזור הזה, כך שהשירות עצמו הוא עכשיו מקור העריכה הראשי."
        action={(
          <button className="compact-button" onClick={addService}>
            <Plus aria-hidden="true" />
            הוסף שירות
          </button>
        )}
      />
      <div className="cards-list">
        {[...content.services].sort((left, right) => left.order - right.order).map((service) => (
          <article className={service.deletedAt ? 'edit-card service-card is-archived' : 'edit-card service-card'} key={service.id}>
            {renderPreviewImage(mediaById.get(service.mediaId))}
            <div className="card-heading">
              <div>
                <p className="kicker">חוויית אירוח באתר</p>
                <h3>{service.title}</h3>
              </div>
              {renderItemActions({
                isArchived: Boolean(service.deletedAt),
                onDuplicate: () => duplicateService(service),
                onArchive: () => archiveService(service.id),
                onRestore: () => restoreService(service.id),
              })}
            </div>
            <div className="toggle-row">
              <Toggle checked={service.active && !service.deletedAt} label="מוצג באתר" onChange={(checked) => updateService(service.id, { active: checked })} />
            </div>
            <Field label="שם החוויה" help="הכותרת הראשית של החוויה בבחירת האירוח.">
              <TextInput value={service.title} onChange={(value) => updateService(service.id, { title: value })} />
            </Field>
            <Field label="כותרת משנה" help="שורת ההסבר הקצרה שמתחת לשם החוויה.">
              <TextInput value={service.subtitle} onChange={(value) => updateService(service.id, { subtitle: value })} />
            </Field>
            <Field label="תיאור" help="הטקסט המרכזי של החוויה.">
              <textarea value={service.description} onChange={(event) => updateService(service.id, { description: event.target.value })} />
            </Field>
            <div className="inline-grid">
              <Field label="מתאים ל..." help="שורת התאמה קצרה באתר.">
                <TextInput value={service.bestFor} onChange={(value) => updateService(service.id, { bestFor: value })} />
              </Field>
              <Field label="משפט הבטחה" help="הדגשה קטנה בכרטיס השירות.">
                <TextInput value={service.promise} onChange={(value) => updateService(service.id, { promise: value })} />
              </Field>
            </div>
            <Field label="נקודות שירות" help="כל נקודה מופרדת בסימן |">
              <TextInput value={joinPipeList(service.details)} onChange={(value) => updateService(service.id, { details: splitPipeList(value) })} />
            </Field>
            <div className="inline-grid">
              <Field label="תמונה לשירות" help="איזו תמונה תופיע בכרטיס.">
                <select value={service.mediaId} onChange={(event) => updateService(service.id, { mediaId: event.target.value })}>
                  {visibleMedia.map((media) => <option key={media.id} value={media.id}>{getMediaLabel(media, content)}</option>)}
                </select>
              </Field>
              <MediaQuickPicker
                label="בחירה מהירה לתמונת השירות"
                mediaItems={visibleMedia}
                selectedMediaId={service.mediaId}
                onSelect={(mediaId) => updateService(service.id, { mediaId })}
                getMediaLabel={(media) => getMediaLabel(media, content)}
                getMediaSrc={getMediaSrc}
              />
              <MediaSelectionUsageNotice
                otherUsages={getOtherUsages(service.mediaId, service.id)}
                getUsageKindLabel={getUsageKindLabel}
              />
              <Field label="טקסט כפתור" help="כפתור הפעולה בכרטיס.">
                <TextInput value={service.cta} onChange={(value) => updateService(service.id, { cta: value })} />
              </Field>
            </div>
            <details className="technical-details">
              <summary>הגדרות טכניות</summary>
              <TextInput value={service.id} onChange={(value) => updateService(service.id, { id: value })} />
              <TextInput value={service.icon} onChange={(value) => updateService(service.id, { icon: value })} />
              {renderNumberInput(service.order, (value) => updateService(service.id, { order: value }))}
            </details>
          </article>
        ))}
      </div>
    </div>
    {preview}
  </section>
);
