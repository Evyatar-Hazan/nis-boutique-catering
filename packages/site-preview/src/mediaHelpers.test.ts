import { describe, expect, it } from 'vitest';
import { getImageProps, getImageSrcSet } from './mediaHelpers';

describe('mediaHelpers', () => {
  it('builds responsive srcSets for webp and skips avif for cms images', () => {
    const image = {
      src: '/media/food/events/dips-tray-close.webp',
      width: 1500,
      height: 2000,
      sizes: '(max-width: 720px) 100vw, 33vw',
      responsive: true,
    };

    expect(getImageSrcSet(image, 'webp')).toContain('1500w');
    expect(getImageProps(image).src).toBe(image.src);
  });

  it('does not emit avif srcSets for cms images', () => {
    expect(
      getImageSrcSet(
        {
          src: '/media/cms/hero-background.webp',
          width: 1500,
          height: 2000,
          responsive: true,
        },
        'avif',
      ),
    ).toBeUndefined();
  });
});
