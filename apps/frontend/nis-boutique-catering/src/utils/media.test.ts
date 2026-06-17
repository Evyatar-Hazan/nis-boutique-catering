import { describe, expect, it } from 'vitest';
import { getImageSrcSet } from './media';

describe('media utilities', () => {
  it('does not advertise missing AVIF variants for Drive-backed CMS images', () => {
    const cmsImage = {
      src: '/media/cms/mini-burger-trays.webp',
      width: 899,
      height: 1599,
      sizes: '(max-width: 720px) 100vw, 33vw',
      responsive: true,
    };

    expect(getImageSrcSet(cmsImage, 'avif')).toBeUndefined();
    expect(getImageSrcSet(cmsImage, 'webp')).toContain('/media/cms/mini-burger-trays-720w.webp 720w');
    expect(getImageSrcSet(cmsImage, 'webp')).toContain('/media/cms/mini-burger-trays.webp 899w');
  });

  it('keeps AVIF variants for committed static media that has them', () => {
    const staticImage = {
      src: '/media/food/events/salmon-skewers-lemon.webp',
      width: 1500,
      height: 2000,
      responsive: true,
    };

    expect(getImageSrcSet(staticImage, 'avif')).toContain('/media/food/events/salmon-skewers-lemon-1500w.avif 1500w');
  });
});
