import { describe, expect, it } from 'vitest';
import { cmsSrcFor, publicAssetSrcFor } from './assetUrlHelpers';

describe('assetUrlHelpers', () => {
  it('builds cms asset paths from media ids', () => {
    expect(cmsSrcFor('hero-background')).toBe('/media/cms/hero-background.webp');
  });

  it('keeps absolute urls and prefixes relative public asset urls', () => {
    expect(publicAssetSrcFor('https://example.com/image.webp')).toBe('https://example.com/image.webp');
    expect(publicAssetSrcFor('/media/cms/hero-background.webp')).toBe('https://nisboutiquecatering.com/media/cms/hero-background.webp');
  });
});
