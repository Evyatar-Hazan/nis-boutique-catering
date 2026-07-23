// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GallerySection, getGalleryFilters } from './GallerySection';
import { SiteSectionPreviewDataProvider } from './SiteSectionPreviewData';
import type { GalleryImage } from './sitePreviewTypes';
import { siteSectionPreviewDataFixture } from './test/siteSectionPreviewDataFixture';

const image = (title: string, category: GalleryImage['category']): GalleryImage => ({
  alt: `תיאור ${title}`,
  category,
  image: { height: 800, responsive: true, src: `/media/${title}.webp`, width: 1200 },
  title,
});

const images = [
  image('שולחן 1', 'tables'), image('שולחן 2', 'tables'), image('מגש 1', 'trays'),
  image('מגש 2', 'trays'), image('סלט 1', 'salads'), image('סלט 2', 'salads'), image('סלט 3', 'salads'),
];

afterEach(cleanup);

describe('integrated gallery media surface', () => {
  it('derives its filters from available media categories', () => {
    expect(getGalleryFilters(images)).toEqual([
      { id: 'all', label: 'הכל' },
      { id: 'salads', label: 'סלטים' },
      { id: 'tables', label: 'שולחנות' },
      { id: 'trays', label: 'מגשים' },
    ]);
  });

  it('shows six initial images and filters without video or duplicate media sections', () => {
    const onFilterChange = vi.fn();
    const { container } = render(<SiteSectionPreviewDataProvider value={siteSectionPreviewDataFixture}>
      <GallerySection activeCategory="all" images={images} onFilterChange={onFilterChange} onOpenImage={vi.fn()} />
    </SiteSectionPreviewDataProvider>);
    expect(screen.getAllByRole('button', { name: /פתח תמונה:/ })).toHaveLength(6);
    expect(container.querySelectorAll('video')).toHaveLength(0);
    expect(container.querySelector('.real-media-section')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'סלטים' }));
    expect(onFilterChange).toHaveBeenCalledWith('salads');
  });
});
