import { AlertTriangle } from 'lucide-react';
import type { ImageAssetRecord } from '@monorepo/content-schema';
import type { MediaUsageKind } from './components/editor/types';

type MediaQuickPickerProps = {
  readonly label: string;
  readonly mediaItems: readonly ImageAssetRecord[];
  readonly selectedMediaId: string;
  readonly onSelect: (mediaId: string) => void;
  readonly getMediaLabel: (media: ImageAssetRecord) => string;
  readonly getMediaSrc: (media: ImageAssetRecord) => string;
};

type MediaSelectionUsageItem = {
  readonly kind: MediaUsageKind;
  readonly id: string;
  readonly title: string;
  readonly active: boolean;
};

type MediaSelectionUsageNoticeProps = {
  readonly otherUsages: readonly MediaSelectionUsageItem[];
  readonly getUsageKindLabel: (kind: MediaUsageKind) => string;
};

export const MediaQuickPicker = ({
  label,
  mediaItems,
  selectedMediaId,
  onSelect,
  getMediaLabel,
  getMediaSrc,
}: MediaQuickPickerProps) => (
  <div className="media-quick-picker" aria-label={label}>
    <div className="media-quick-picker-heading">
      <strong>{label}</strong>
      <span>לחיצה אחת מחליפה את התמונה באזור הזה.</span>
    </div>
    <div className="media-choice-list">
      {mediaItems.map((media) => {
        const selected = media.id === selectedMediaId;
        const src = getMediaSrc(media);
        const title = getMediaLabel(media);

        return (
          <button
            type="button"
            className={selected ? 'media-choice is-selected' : 'media-choice'}
            key={media.id}
            onClick={() => onSelect(media.id)}
            aria-pressed={selected}
            title={title}
          >
            {src ? <img src={src} alt="" loading="lazy" /> : <span className="media-choice-empty">אין תמונה</span>}
            <span>{title}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export const MediaSelectionUsageNotice = ({
  otherUsages,
  getUsageKindLabel,
}: MediaSelectionUsageNoticeProps) => {
  const activeOtherUsages = otherUsages.filter((usage) => usage.active);

  return (
    <div className={activeOtherUsages.length > 0 ? 'media-selection-usage has-risk' : 'media-selection-usage'}>
      <strong>התמונה הזאת מחוברת גם ל...</strong>
      {otherUsages.length > 0 ? (
        <div className="usage-chips" aria-label="שימושים נוספים לתמונה">
          {otherUsages.map((usage) => (
            <span className={usage.active ? 'usage-chip is-active' : 'usage-chip'} key={`${usage.kind}-${usage.id}`}>
              {getUsageKindLabel(usage.kind)}: {usage.title}
              {!usage.active ? ' (כבוי)' : ''}
            </span>
          ))}
        </div>
      ) : (
        <span className="usage-empty">אין שימוש נוסף לתמונה הזאת כרגע.</span>
      )}
      {activeOtherUsages.length > 0 && (
        <span className="selection-risk-text">
          <AlertTriangle aria-hidden="true" />
          החלפה או שינוי מקור ישפיעו גם על המקומות הפעילים שמסומנים כאן.
        </span>
      )}
    </div>
  );
};
