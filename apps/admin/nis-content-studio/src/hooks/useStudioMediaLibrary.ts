import { useMemo, useState } from 'react';
import {
  formatMediaUsageList,
  getActiveMediaUsages,
  getMediaLabel,
  getMediaStatus,
  getMediaUsage,
  type ContentSnapshot,
  type ImageAssetRecord,
} from '@monorepo/content-schema';
import {
  archiveMediaInSnapshot,
  archiveSelectedMediaInSnapshot,
  normalizeMediaId,
  renameMediaInSnapshot,
  restoreMediaInSnapshot,
  restoreSelectedMediaInSnapshot,
  updateMediaInSnapshot,
} from '../contentMutations';
import { saveContentToSheets } from '../googleApi';
import type { PublishState } from '../publishWorkflowHelpers';

export type MediaLibraryFilter = 'all' | 'used' | 'unused' | 'missing-drive' | 'archived';

type UseStudioMediaLibraryArgs = {
  readonly content: ContentSnapshot;
  readonly session: { readonly accessToken: string } | null;
  readonly buildNextContent: (
    current: ContentSnapshot,
    updater: (snapshot: ContentSnapshot) => ContentSnapshot,
  ) => ContentSnapshot;
  readonly updateContent: (updater: (current: ContentSnapshot) => ContentSnapshot) => void;
  readonly getFreshAccessToken: () => Promise<string>;
  readonly runTask: (label: string, task: () => Promise<void>) => Promise<void>;
  readonly setContent: (nextContent: ContentSnapshot) => void;
  readonly setPublishState: (state: PublishState) => void;
  readonly setStatus: (message: string) => void;
};

export const useStudioMediaLibrary = ({
  content,
  session,
  buildNextContent,
  updateContent,
  getFreshAccessToken,
  runTask,
  setContent,
  setPublishState,
  setStatus,
}: UseStudioMediaLibraryArgs) => {
  const [query, setQuery] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<readonly string[]>([]);
  const [mediaFilter, setMediaFilter] = useState<MediaLibraryFilter>('all');

  const filteredMedia = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const byUsageTitles = (mediaId: string) => getMediaUsage(mediaId, content).map((usage) => usage.title).join(' ');

    return [...content.media]
      .filter((media) => {
        const usageCount = getMediaUsage(media.id, content).length;
        const matchesFilter = (
          mediaFilter === 'all'
          || (mediaFilter === 'used' && usageCount > 0 && !media.deletedAt)
          || (mediaFilter === 'unused' && usageCount === 0 && !media.deletedAt)
          || (mediaFilter === 'missing-drive' && !media.driveFileId && !media.deletedAt)
          || (mediaFilter === 'archived' && Boolean(media.deletedAt))
        );
        if (!matchesFilter) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }

        return [
          media.id,
          media.usageNotes ?? '',
          getMediaStatus(media, content),
          byUsageTitles(media.id),
        ].join(' ').toLowerCase().includes(normalizedQuery);
      })
      .sort((left, right) => {
        if (Boolean(left.deletedAt) !== Boolean(right.deletedAt)) {
          return left.deletedAt ? 1 : -1;
        }
        return getMediaLabel(left, content).localeCompare(getMediaLabel(right, content), 'he');
      });
  }, [content, mediaFilter, query]);

  const selectedMedia = selectedMediaId ? content.media.find((media) => media.id === selectedMediaId) ?? null : null;
  const activeSelectedMedia = selectedMedia && filteredMedia.some((media) => media.id === selectedMedia.id)
    ? selectedMedia
    : filteredMedia[0] ?? null;
  const bulkSelectedMedia = content.media.filter((media) => selectedMediaIds.includes(media.id));
  const areAllVisibleSelected = filteredMedia.length > 0 && filteredMedia.every((media) => selectedMediaIds.includes(media.id));

  const updateMedia = (id: string, patch: Partial<ImageAssetRecord>) => {
    updateContent((current) => updateMediaInSnapshot(current, id, patch));
  };

  const saveMediaTitle = (id: string, title: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    void runTask('שומרים את שם התמונה', async () => {
      if (!session) {
        throw new Error('צריך להתחבר לפני שמירה.');
      }

      const nextSnapshot = buildNextContent(content, (current) => updateMediaInSnapshot(current, id, { title: trimmedTitle }));

      setContent(nextSnapshot);
      setPublishState('saving');
      const accessToken = await getFreshAccessToken();
      await saveContentToSheets(accessToken, nextSnapshot);
      setPublishState('draft');
      setStatus('שם התמונה נשמר ב-Google Sheets.');
    });
  };

  const renameMedia = (id: string, nextId: string) => {
    const cleanId = normalizeMediaId(nextId);
    updateContent((current) => renameMediaInSnapshot(current, id, nextId));
    setSelectedMediaId(cleanId);
  };

  const archiveMedia = (id: string) => {
    const activeUsages = getActiveMediaUsages(id, content);
    if (activeUsages.length > 0) {
      const ok = window.confirm(`התמונה הזאת עדיין מוצגת באתר ב-${activeUsages.length} מקום/ות:\n${formatMediaUsageList(activeUsages)}\n\nלהעביר אותה לארכיון בכל זאת?`);
      if (!ok) {
        setStatus('הארכוב בוטל. קודם החליפו את התמונה באזורים שבהם היא בשימוש.');
        return;
      }
    }

    updateContent((current) => archiveMediaInSnapshot(current, id));
  };

  const restoreMedia = (id: string) => {
    updateContent((current) => restoreMediaInSnapshot(current, id));
  };

  const toggleSelectedMedia = (mediaId: string) => {
    setSelectedMediaIds((current) => (current.includes(mediaId) ? current.filter((id) => id !== mediaId) : [...current, mediaId]));
  };

  const toggleSelectAllVisibleMedia = () => {
    const visibleIds = filteredMedia.map((media) => media.id);
    setSelectedMediaIds(areAllVisibleSelected ? [] : visibleIds);
  };

  const archiveSelectedMedia = () => {
    const targetIds = bulkSelectedMedia.filter((media) => !media.deletedAt).map((media) => media.id);
    if (targetIds.length === 0) {
      return;
    }

    updateContent((current) => archiveSelectedMediaInSnapshot(current, targetIds));
    setSelectedMediaIds([]);
  };

  const restoreSelectedMedia = () => {
    const targetIds = bulkSelectedMedia.filter((media) => media.deletedAt).map((media) => media.id);
    if (targetIds.length === 0) {
      return;
    }

    updateContent((current) => restoreSelectedMediaInSnapshot(current, targetIds));
    setSelectedMediaIds([]);
  };

  return {
    query,
    setQuery,
    selectedMediaId,
    setSelectedMediaId,
    selectedMediaIds,
    mediaFilter,
    setMediaFilter,
    filteredMedia,
    activeSelectedMedia,
    bulkSelectedMedia,
    areAllVisibleSelected,
    updateMedia,
    saveMediaTitle,
    renameMedia,
    archiveMedia,
    restoreMedia,
    toggleSelectedMedia,
    toggleSelectAllVisibleMedia,
    archiveSelectedMedia,
    restoreSelectedMedia,
  };
};
