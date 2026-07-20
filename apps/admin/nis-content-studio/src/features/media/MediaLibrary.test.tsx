import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { createPublicSiteDocument } from '../../../functions/_lib/test/publicSiteDocument';
import { StudioApiError } from '../../api/client';
import { studioApi, type MediaAssetDto } from '../../api/studioApi';
import { MediaLibrary } from './MediaLibrary';

const asset = (id: string, references: readonly string[] = []): MediaAssetDto => ({
  altText: `תיאור ${id}`,
  createdAt: 1,
  createdBy: 'admin-1',
  deletedAt: null,
  height: 900,
  id,
  mimeType: 'image/webp',
  objectKey: `originals/${id}/image.webp`,
  originalFileName: `${id}.webp`,
  references: [...references],
  sha256Hex: 'a'.repeat(64),
  sizeBytes: 2_048,
  updatedAt: 1,
  width: 1_200,
});

const renderLibrary = (assets: readonly MediaAssetDto[], expectedKind: 'image' | 'video' | null = 'image') => {
  vi.spyOn(studioApi, 'listMedia').mockResolvedValue({ media: [...assets] });
  const onSelect = vi.fn();
  const onMediaMetadataChange = vi.fn();
  render(<MediaLibrary
    document={createPublicSiteDocument('media-test')}
    expectedKind={expectedKind}
    onClose={vi.fn()}
    onMediaMetadataChange={onMediaMetadataChange}
    onSelect={onSelect}
    onUnauthorized={vi.fn()}
    open
  />);
  return { onMediaMetadataChange, onSelect };
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('R2 media library', () => {
  it('shows reference counts, protects used media, and selects through one picker', async () => {
    const used = asset('image-1', ['draft:revision-1']);
    const { onSelect } = renderLibrary([used]);
    expect(await screen.findByText('1 שימושים בטיוטה הפתוחה · 1 גרסאות פעילות בשרת')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ארכב' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'בחר / החלף' }));
    expect(onSelect).toHaveBeenCalledWith(used, undefined);
  });

  it('archives an unused asset and keeps the server response in sync', async () => {
    const unused = asset('unused-image');
    const archived = { ...unused, deletedAt: 10 };
    vi.spyOn(studioApi, 'updateMedia').mockResolvedValue({ media: archived });
    const { onMediaMetadataChange } = renderLibrary([unused]);
    fireEvent.click(await screen.findByRole('button', { name: 'ארכב' }));
    expect(await screen.findByText('המדיה הועברה לארכיון.')).toBeInTheDocument();
    expect(onMediaMetadataChange).toHaveBeenCalledWith(archived);
    expect(screen.getByRole('button', { name: 'שחזר' })).toBeInTheDocument();
  });

  it('rejects invalid files before upload', async () => {
    const upload = vi.spyOn(studioApi, 'uploadMedia');
    renderLibrary([]);
    const file = new File(['bad'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('קובץ תמונה או וידאו'), { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText('תיאור ברור / alt'), { target: { value: 'קובץ לא תקין' } });
    fireEvent.click(screen.getByRole('button', { name: 'העלה ל־R2' }));
    expect(await screen.findByText('הקובץ אינו נתמך או גדול מ־12MB.')).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });

  it('requires alt text before an image can be used publicly', async () => {
    renderLibrary([{ ...asset('missing-alt'), altText: '' }]);
    expect(await screen.findByRole('button', { name: 'בחר / החלף' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'בחר / החלף' })).toHaveAttribute('title', 'יש למלא תיאור alt לפני שימוש באתר');
  });

  it('retains a failed upload for an explicit retry', async () => {
    const uploaded = asset('new-image');
    const upload = vi.spyOn(studioApi, 'uploadMedia')
      .mockRejectedValueOnce(new StudioApiError({ code: 'network_error', kind: 'network', message: 'אין חיבור.', status: 0 }))
      .mockResolvedValueOnce({ media: uploaded });
    renderLibrary([]);
    const file = new File(['image'], 'new-image.webp', { type: 'image/webp' });
    fireEvent.change(screen.getByLabelText('קובץ תמונה או וידאו'), { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText('תיאור ברור / alt'), { target: { value: 'תיאור חדש' } });
    fireEvent.click(screen.getByRole('button', { name: 'העלה ל־R2' }));
    fireEvent.click(await screen.findByRole('button', { name: 'נסה העלאה שוב' }));
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('הקובץ הועלה ונבדק. אפשר לבחור בו כעת.')).toBeInTheDocument();
    expect(screen.getByText('new-image.webp')).toBeInTheDocument();
  });
});
