import { describe, expect, it } from 'vitest';
import { publicSiteDocument } from '../generated/publicSiteDocument.generated';
import { createHeroPreload } from './heroPreload';

describe('createHeroPreload', () => {
  it('uses the exact v2 Hero media and its generated WebP variants', () => {
    const preload = createHeroPreload(publicSiteDocument);
    const mediaId = publicSiteDocument.sections.hero.mediaId;

    expect(preload.type).toBe('image/webp');
    expect(preload.href).toBe(`/media/cms/${mediaId}.webp`);
    expect(preload.imageSrcSet).toContain(`/media/cms/${mediaId}-720w.webp 720w`);
    expect(preload.imageSrcSet).toContain(`/media/cms/${mediaId}-960w.webp 960w`);
    expect(preload.imageSizes).toContain('calc(100vw - 2rem)');
  });

  it('fails closed when the referenced Hero image is unavailable', () => {
    const invalidDocument = {
      ...publicSiteDocument,
      sections: {
        ...publicSiteDocument.sections,
        hero: {
          ...publicSiteDocument.sections.hero,
          mediaId: 'missing-image',
        },
      },
    };

    expect(() => createHeroPreload(invalidDocument)).toThrow(
      'active image missing-image is missing',
    );
  });
});
