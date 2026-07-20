// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GallerySection, getGalleryFilters } from './GallerySection';
import { fallbackSiteSectionPreviewData } from './fallbackSiteSectionPreviewData';
import { SiteSectionPreviewDataProvider } from './SiteSectionPreviewData';
import type { GalleryImage } from './sitePreviewTypes';

const image = (title: string, category: GalleryImage['category']): GalleryImage => ({
  alt: `תיאור ${title}`,
  category,
  image: { height: 800, responsive: true, src: `/media/${title}.webp`, width: 1200 },
  title,
});

const images = [
  image('שולחן 1', 'tables'), image('שולחן 2', 'tables'), image('מגש 1', 'trays'),
  image('מגש 2', 'trays'), image('דג 1', 'fish'), image('דג 2', 'fish'), image('קפה 1', 'coffee'),
];

afterEach(cleanup);

describe('integrated gallery media surface', () => {
  it('derives its filters from available media categories', () => {
    expect(getGalleryFilters(images)).toEqual([
      { id: 'all', label: 'הכל' },
      { id: 'coffee', label: 'קפה' },
      { id: 'fish', label: 'דגים' },
      { id: 'tables', label: 'שולחנות' },
      { id: 'trays', label: 'מגשים' },
    ]);
  });

  it('shows six initial images, one video and filters without duplicate media sections', () => {
    const onFilterChange = vi.fn();
    const { container } = render(<SiteSectionPreviewDataProvider value={fallbackSiteSectionPreviewData}>
      <GallerySection activeCategory="all" images={images} onFilterChange={onFilterChange} onOpenImage={vi.fn()} />
    </SiteSectionPreviewDataProvider>);
    expect(screen.getAllByRole('button', { name: /פתח תמונה:/ })).toHaveLength(6);
    expect(screen.getByLabelText('וידאו מהאירוח')).toHaveAttribute('preload', 'metadata');
    expect(container.querySelectorAll('video')).toHaveLength(1);
    expect(container.querySelector('.real-media-section')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'דגים' }));
    expect(onFilterChange).toHaveBeenCalledWith('fish');
  });
});
