import { describe, expect, it } from 'vitest';
import type { ContentSnapshot } from '@monorepo/content-schema';
import { createHeroPreload } from './heroPreload';

const snapshot = (items: readonly string[], src: string): ContentSnapshot => ({
  version: 'test',
  updatedAt: '2026-07-20T00:00:00.000Z',
  settings: {
    email: 'hello@example.com',
    siteVersion: 'test',
  },
  gallery: [],
  services: [],
  sections: [{ id: 'hero-media', group: 'hero-media', items: [...items], active: true, order: 0 }],
  media: [
    { id: 'background', src: '/media/background.webp', width: 1200, height: 800, responsive: true },
    { id: 'hero', src, width: 1500, height: 2000, sizes: '100vw', responsive: true },
  ],
});

describe('createHeroPreload', () => {
  it('matches the second legacy Hero media and its AVIF variants', () => {
    const preload = createHeroPreload(snapshot(['background', 'hero'], '/media/hero.webp'));

    expect(preload.type).toBe('image/avif');
    expect(preload.href).toBe('/media/hero-1500w.avif');
    expect(preload.imageSrcSet).toContain('/media/hero-720w.avif 720w');
    expect(preload.imageSizes).toContain('calc(100vw - 2rem)');
  });

  it('matches the first v2 Hero media and uses WebP for CMS assets', () => {
    const preload = createHeroPreload(snapshot(['hero'], '/media/cms/hero.webp'));

    expect(preload.type).toBe('image/webp');
    expect(preload.href).toBe('/media/cms/hero.webp');
    expect(preload.imageSrcSet).toContain('/media/cms/hero-720w.webp 720w');
    expect(preload.imageSrcSet).toContain('/media/cms/hero-960w.webp 960w');
  });
});
