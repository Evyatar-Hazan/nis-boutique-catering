import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { MediaItem } from './api';
import { MediaGallery } from './MediaGallery';

const item: MediaItem = {
  createdAt: '2026-07-24T10:00:00.000Z',
  description: 'מגש גבינות לאירוח',
  height: 900,
  id: 'drive-file-1',
  mimeType: 'image/jpeg',
  modifiedAt: '2026-07-24T10:00:00.000Z',
  name: 'מגש גבינות לאירוח.jpg',
  sizeBytes: 250_000,
  trashed: false,
  webViewLink: 'https://drive.google.com/file/d/drive-file-1/view',
  width: 1200,
};

afterEach(cleanup);

describe('MediaGallery', () => {
  it('filters the visible library by description', () => {
    render(<MediaGallery items={[item]} onChange={vi.fn()} showTrash={false} />);
    expect(screen.getByRole('heading', { name: item.description })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'לא קיים' } });
    expect(screen.getByText('לא נמצאו תמונות')).toBeInTheDocument();
  });

  it('offers rename and recoverable removal actions', () => {
    render(<MediaGallery items={[item]} onChange={vi.fn()} showTrash={false} />);
    expect(screen.getByRole('button', { name: 'שינוי שם' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'הסרה' })).toBeInTheDocument();
  });

  it('keeps rendering when Drive omits a valid modified date', () => {
    render(<MediaGallery items={[{ ...item, modifiedAt: '' }]} onChange={vi.fn()} showTrash={false} />);
    expect(screen.getByRole('heading', { name: item.description })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'שינוי שם' })).toBeInTheDocument();
  });
});
