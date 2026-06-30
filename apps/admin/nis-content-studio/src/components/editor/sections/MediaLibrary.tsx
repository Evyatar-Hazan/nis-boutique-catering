import { useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import type { ContentSnapshot, ImageAssetRecord } from '@monorepo/content-schema';
import { Cloud, ExternalLink, Images, MonitorCheck, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import { Field } from '../Field';
import { TextInput } from '../TextInput';
import type { MediaLibraryFilter } from '../../../hooks/useStudioMediaLibrary';
type MediaUsageEntry = {
  readonly kind: string;
  readonly id: string;
  readonly title: string;
  readonly active: boolean;
};

type ImageUploadDropzoneProps = {
  readonly disabled: boolean;
  readonly isActive: boolean;
  readonly onDragStateChange: (active: boolean) => void;
  readonly onDrop: (event: DragEvent<HTMLElement>) => void;
  readonly onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export const ImageUploadDropzone = ({
  disabled,
  isActive,
  onDragStateChange,
  onDrop,
  onUpload,
}: ImageUploadDropzoneProps) => (
  <label
    className={isActive ? 'image-upload-dropzone is-active' : 'image-upload-dropzone'}
    onDragEnter={() => onDragStateChange(true)}
    onDragLeave={(event) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
        return;
      }
      onDragStateChange(false);
    }}
    onDragOver={(event) => {
      event.preventDefault();
      onDragStateChange(true);
    }}
    onDrop={onDrop}
  >
    <input type="file" accept="image/*" onChange={onUpload} disabled={disabled} />
    <div className="image-upload-dropzone-copy">
      <span className="image-upload-icon">
        <Upload aria-hidden="true" />
      </span>
      <div>
        <strong>הוספת תמונה חדשה</strong>
        <p>לחצו לבחירת קובץ או גררו תמונה לכאן כדי להעלות אותה ל-Google Drive.</p>
      </div>
    </div>
    <span className="image-upload-cta">{disabled ? 'צריך חיבור Google פעיל' : 'בחירת קובץ או גרירה'}</span>
  </label>
);

type ImagesLibraryToolbarProps = {
  readonly query: string;
  readonly onQueryChange: (value: string) => void;
  readonly totalCount: number;
  readonly filteredCount: number;
  readonly filter: MediaLibraryFilter;
  readonly onFilterChange: (filter: MediaLibraryFilter) => void;
  readonly selectedCount: number;
  readonly areAllVisibleSelected: boolean;
  readonly onToggleSelectAll: () => void;
  readonly onArchiveSelected: () => void;
  readonly onRestoreSelected: () => void;
  readonly filterLabels: Readonly<Record<MediaLibraryFilter, string>>;
};

export const ImagesLibraryToolbar = ({
  query,
  onQueryChange,
  totalCount,
  filteredCount,
  filter,
  onFilterChange,
  selectedCount,
  areAllVisibleSelected,
  onToggleSelectAll,
  onArchiveSelected,
  onRestoreSelected,
  filterLabels,
}: ImagesLibraryToolbarProps) => (
  <div className="images-library-toolbar">
    <div className="images-toolbar-meta">
      <div className="area-status-pill">
        <Cloud aria-hidden="true" />
        <span>{filteredCount} מתוך {totalCount} תמונות</span>
      </div>
      <div className="media-filter-row" aria-label="סינון ספריית תמונות">
        {(Object.keys(filterLabels) as MediaLibraryFilter[]).map((filterOption) => (
          <button
            type="button"
            key={filterOption}
            className={filter === filterOption ? 'filter-chip is-active' : 'filter-chip'}
            onClick={() => onFilterChange(filterOption)}
          >
            {filterLabels[filterOption]}
          </button>
        ))}
      </div>
    </div>
    <div className="images-toolbar-actions">
      <label className="search-box">
        <Search aria-hidden="true" />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="חיפוש לפי שם, הערה או שימוש באתר" />
      </label>
      <div className="bulk-actions-bar">
        <button type="button" className="ghost-button" onClick={onToggleSelectAll}>
          {areAllVisibleSelected ? 'נקה בחירה' : 'בחר את כל המסוננים'}
        </button>
        <span className="bulk-selection-status">{selectedCount > 0 ? `${selectedCount} נבחרו` : 'אין בחירה מרובה'}</span>
        <button type="button" className="ghost-button" onClick={onArchiveSelected} disabled={selectedCount === 0}>
          <Trash2 aria-hidden="true" />
          ארכב נבחרים
        </button>
        <button type="button" className="ghost-button" onClick={onRestoreSelected} disabled={selectedCount === 0}>
          <RotateCcw aria-hidden="true" />
          שחזר נבחרים
        </button>
      </div>
    </div>
  </div>
);

type ImagesGridProps = {
  readonly items: readonly ImageAssetRecord[];
  readonly selectedMediaId: string | null;
  readonly selectedMediaIds: readonly string[];
  readonly onSelect: (mediaId: string) => void;
  readonly onToggleSelect: (mediaId: string) => void;
  readonly getMediaLabel: (media: ImageAssetRecord) => string;
  readonly renderPreview: (media: ImageAssetRecord) => ReactNode;
};

export const ImagesGrid = ({
  items,
  selectedMediaId,
  selectedMediaIds,
  onSelect,
  onToggleSelect,
  getMediaLabel,
  renderPreview,
}: ImagesGridProps) => (
  <div className="images-library-grid" aria-label="ספריית תמונות">
    {items.map((media) => {
      const selected = media.id === selectedMediaId;
      const multiSelected = selectedMediaIds.includes(media.id);

      return (
        <article
          key={media.id}
          className={`${selected ? 'image-library-card is-selected' : 'image-library-card'}${multiSelected ? ' is-multi-selected' : ''}`}
        >
          <span className="image-card-selection">
            <input
              type="checkbox"
              checked={multiSelected}
              onChange={() => onToggleSelect(media.id)}
              aria-label={`בחירה מרובה עבור ${getMediaLabel(media)}`}
            />
          </span>
          <button type="button" className="image-card-open" onClick={() => onSelect(media.id)}>
            {renderPreview(media)}
            <div className="image-library-card-body">
              <h3>{getMediaLabel(media)}</h3>
            </div>
          </button>
        </article>
      );
    })}
  </div>
);

type ImageUsageLinksProps = {
  readonly mediaId: string;
  readonly getMediaUsages: (mediaId: string) => readonly MediaUsageEntry[];
  readonly getUsageKindLabel: (kind: string) => string;
  readonly onNavigateToSiteMap: () => void;
  readonly onNavigateToUsage: (kind: string) => void;
};

const ImageUsageLinks = ({
  mediaId,
  getMediaUsages,
  getUsageKindLabel,
  onNavigateToSiteMap,
  onNavigateToUsage,
}: ImageUsageLinksProps) => {
  const usages = getMediaUsages(mediaId);

  if (usages.length === 0) {
    return (
      <div className="usage-links-empty">
        <span>התמונה עדיין לא מחוברת לשום אזור באתר.</span>
        <button type="button" className="ghost-button" onClick={onNavigateToSiteMap}>
          <MonitorCheck aria-hidden="true" />
          לעבור לניהול האתר
        </button>
      </div>
    );
  }

  return (
    <div className="usage-links-list">
      {usages.map((usage) => (
        <button
          type="button"
          key={`${usage.kind}-${usage.id}`}
          className={usage.active ? 'usage-link-chip is-active' : 'usage-link-chip'}
          onClick={() => onNavigateToUsage(usage.kind)}
        >
          <span>{getUsageKindLabel(usage.kind)}: {usage.title}</span>
          <ExternalLink aria-hidden="true" />
        </button>
      ))}
    </div>
  );
};

type ImageDetailsPanelProps = {
  readonly media: ImageAssetRecord | null;
  readonly content: ContentSnapshot;
  readonly canUseGoogle: boolean;
  readonly onRename: (currentId: string, nextId: string) => void;
  readonly onSaveTitle: (id: string, title: string) => void;
  readonly onUpdate: (id: string, patch: Partial<ImageAssetRecord>) => void;
  readonly onPickDriveFile: (mediaId: string) => void;
  readonly onNavigateToSiteMap: () => void;
  readonly onNavigateToUsage: (kind: string) => void;
  readonly getMediaLabel: (media: ImageAssetRecord) => string;
  readonly getMediaStatus: (media: ImageAssetRecord, content: ContentSnapshot) => string;
  readonly getMediaUsages: (mediaId: string) => readonly MediaUsageEntry[];
  readonly getUsageKindLabel: (kind: string) => string;
  readonly renderPreview: (media: ImageAssetRecord, showActions?: boolean) => ReactNode;
  readonly renderItemActions: (media: ImageAssetRecord) => ReactNode;
  readonly renderMediaRiskNotice: (mediaId: string) => ReactNode;
  readonly renderNumberInput: (value: number, onChange: (value: number) => void) => ReactNode;
};

export const ImageDetailsPanel = ({
  media,
  content,
  canUseGoogle,
  onRename,
  onSaveTitle,
  onUpdate,
  onPickDriveFile,
  onNavigateToSiteMap,
  onNavigateToUsage,
  getMediaLabel,
  getMediaStatus,
  getMediaUsages,
  getUsageKindLabel,
  renderPreview,
  renderItemActions,
  renderMediaRiskNotice,
  renderNumberInput,
}: ImageDetailsPanelProps) => {
  const currentMediaLabel = media ? getMediaLabel(media) : '';
  const [mediaNameDraft, setMediaNameDraft] = useState(currentMediaLabel);

  if (!media) {
    return (
      <aside className="image-details-panel is-empty">
        <div className="image-details-empty">
          <Images aria-hidden="true" />
          <strong>בחרו תמונה כדי לראות את הפרטים שלה</strong>
          <p>כאן יופיעו התצוגה המקדימה, עריכת הפרטים, מחיקה, והקישורים לאזורים שבהם התמונה בשימוש באתר.</p>
        </div>
      </aside>
    );
  }

  const commitMediaTitle = () => {
    const nextValue = mediaNameDraft.trim();
    if (!nextValue || nextValue === currentMediaLabel) {
      setMediaNameDraft(currentMediaLabel);
      return;
    }

    onSaveTitle(media.id, nextValue);
  };

  return (
    <aside className="image-details-panel">
      <div className="image-details-panel-header">
        <div>
          <p className="kicker">{getMediaStatus(media, content)}</p>
          <h3>{getMediaLabel(media)}</h3>
          <div className="image-details-summary">
            <span>{getMediaUsages(media.id).length} שימושים</span>
            <span>{media.width}×{media.height}</span>
            <span>{media.driveFileId ? 'מחובר ל-Drive' : 'ללא מקור Drive'}</span>
          </div>
        </div>
        {renderItemActions(media)}
      </div>
      {renderPreview(media)}
      {renderMediaRiskNotice(media.id)}
      <div className="usage-list">
        <strong>איפה התמונה מופיעה באתר</strong>
        <ImageUsageLinks
          mediaId={media.id}
          getMediaUsages={getMediaUsages}
          getUsageKindLabel={getUsageKindLabel}
          onNavigateToSiteMap={onNavigateToSiteMap}
          onNavigateToUsage={onNavigateToUsage}
        />
      </div>
      <div className="media-quick-actions">
        <button className="ghost-button" onClick={() => onPickDriveFile(media.id)} disabled={!canUseGoogle}>
          החלף מקור מדרייב
        </button>
        <button className="ghost-button" onClick={onNavigateToSiteMap}>
          <MonitorCheck aria-hidden="true" />
          לעבור לניהול האתר
        </button>
      </div>
      <Field label="שם התמונה" help="השם בעברית שמופיע בסטודיו ועוזר לזהות את התמונה מהר.">
        <TextInput
          value={mediaNameDraft}
          onChange={setMediaNameDraft}
          onBlur={commitMediaTitle}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitMediaTitle();
            }
            if (event.key === 'Escape') {
              setMediaNameDraft(currentMediaLabel);
            }
          }}
        />
      </Field>
      <Field label="הערות שימוש" help="הסבר פנימי קצר מתי כדאי להשתמש בתמונה.">
        <TextInput value={media.usageNotes ?? ''} onChange={(value) => onUpdate(media.id, { usageNotes: value })} />
      </Field>
      <div className="inline-grid">
        <Field label="רוחב" help="נלקח מהתמונה המקורית בדרייב.">
          {renderNumberInput(media.width, (value) => onUpdate(media.id, { width: value }))}
        </Field>
        <Field label="גובה" help="נלקח מהתמונה המקורית בדרייב.">
          {renderNumberInput(media.height, (value) => onUpdate(media.id, { height: value }))}
        </Field>
      </div>
      <details className="technical-details">
        <summary>פרטים טכניים</summary>
        <Field label="מזהה טכני" help="מזהה באנגלית לקבצים, לקישורים ולשימושים פנימיים במערכת.">
          <TextInput value={media.id} onChange={(value) => onRename(media.id, value)} />
        </Field>
        <Field label="כתובת באתר אחרי פרסום" help="נוצרת אוטומטית מתוך Drive בזמן build.">
          <TextInput value={media.src} onChange={(value) => onUpdate(media.id, { src: value })} />
        </Field>
        <Field label="מקור Drive" help="מזהה הקובץ בדרייב.">
          <TextInput value={media.driveFileId ?? ''} onChange={(value) => onUpdate(media.id, { driveFileId: value || undefined })} />
        </Field>
      </details>
    </aside>
  );
};
