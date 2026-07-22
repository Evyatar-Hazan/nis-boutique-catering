import { isPaletteId, type PaletteId } from './palettes';

export const paletteStorageKey = 'nis-palette-lab-selection-v1';
export const paletteLabQueryKey = 'paletteLab';
export const paletteQueryKey = 'palette';

const readStoredPalette = (storage: Pick<Storage, 'getItem'>): PaletteId | null => {
  try {
    const storedPalette = storage.getItem(paletteStorageKey);
    return isPaletteId(storedPalette) ? storedPalette : null;
  } catch {
    return null;
  }
};

export const resolvePalette = (
  search: string,
  storage: Pick<Storage, 'getItem'>,
): PaletteId => {
  const queryPalette = new URLSearchParams(search).get(paletteQueryKey);

  if (queryPalette !== null) {
    return isPaletteId(queryPalette) ? queryPalette : 'original';
  }

  return readStoredPalette(storage) ?? 'original';
};

export const isPaletteLabEnabled = (search: string): boolean =>
  new URLSearchParams(search).get(paletteLabQueryKey) === '1';

export const applyPalette = (palette: PaletteId, root: HTMLElement = document.documentElement): void => {
  if (palette === 'original') {
    delete root.dataset.palette;
    return;
  }

  root.dataset.palette = palette;
};

export const persistPalette = (palette: PaletteId, storage: Pick<Storage, 'setItem'>): void => {
  try {
    storage.setItem(paletteStorageKey, palette);
  } catch {
    // The visual selection remains active when storage is unavailable.
  }
};

export const buildPaletteUrl = (palette: PaletteId, currentUrl: URL): URL => {
  const nextUrl = new URL(currentUrl);
  nextUrl.searchParams.set(paletteLabQueryKey, '1');

  if (palette === 'original') {
    nextUrl.searchParams.delete(paletteQueryKey);
  } else {
    nextUrl.searchParams.set(paletteQueryKey, palette);
  }

  return nextUrl;
};

export const initializePalette = (): PaletteId => {
  const palette = resolvePalette(window.location.search, window.localStorage);
  applyPalette(palette);
  return palette;
};
