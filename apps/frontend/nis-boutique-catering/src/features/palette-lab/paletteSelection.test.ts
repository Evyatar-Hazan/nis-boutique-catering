import { describe, expect, it } from 'vitest';
import { applyPalette, buildPaletteUrl, isPaletteLabEnabled, resolvePalette } from './paletteSelection';

const storageWith = (value: string | null): Pick<Storage, 'getItem'> => ({
  getItem: () => value,
});

describe('Palette Lab selection', () => {
  it('resolves query before storage and falls back safely for invalid query values', () => {
    expect(resolvePalette('?palette=midnight-copper', storageWith('olive-linen'))).toBe('midnight-copper');
    expect(resolvePalette('?palette=unknown', storageWith('olive-linen'))).toBe('original');
    expect(resolvePalette('', storageWith('olive-linen'))).toBe('olive-linen');
    expect(resolvePalette('', storageWith('unknown'))).toBe('original');
  });

  it('enables the lab only for the explicit query flag', () => {
    expect(isPaletteLabEnabled('?paletteLab=1')).toBe(true);
    expect(isPaletteLabEnabled('?paletteLab=0')).toBe(false);
    expect(isPaletteLabEnabled('?palette=olive-linen')).toBe(false);
  });

  it('applies alternative palettes and removes the root attribute for the original', () => {
    const root = document.createElement('html');

    applyPalette('forest-butter', root);
    expect(root).toHaveAttribute('data-palette', 'forest-butter');

    applyPalette('original', root);
    expect(root).not.toHaveAttribute('data-palette');
  });

  it('builds shareable URLs while preserving unrelated query and hash state', () => {
    const url = new URL('https://example.com/?source=client#gallery');
    const themedUrl = buildPaletteUrl('stone-coral', url);

    expect(themedUrl.searchParams.get('paletteLab')).toBe('1');
    expect(themedUrl.searchParams.get('palette')).toBe('stone-coral');
    expect(themedUrl.searchParams.get('source')).toBe('client');
    expect(themedUrl.hash).toBe('#gallery');

    expect(buildPaletteUrl('original', themedUrl).searchParams.has('palette')).toBe(false);
  });
});
