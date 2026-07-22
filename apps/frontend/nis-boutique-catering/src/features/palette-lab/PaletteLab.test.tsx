import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaletteLab } from './PaletteLab';
import { paletteStorageKey } from './paletteSelection';

const setUrl = (path: string) => window.history.replaceState({}, '', path);
const storedValues = new Map<string, string>();
const storageMock: Storage = {
  get length() {
    return storedValues.size;
  },
  clear: () => storedValues.clear(),
  getItem: (key) => storedValues.get(key) ?? null,
  key: (index) => [...storedValues.keys()][index] ?? null,
  removeItem: (key) => storedValues.delete(key),
  setItem: (key, value) => storedValues.set(key, value),
};

describe('PaletteLab', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: storageMock,
      configurable: true,
    });
    window.localStorage.clear();
    delete document.documentElement.dataset.palette;
    setUrl('/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    delete document.documentElement.dataset.palette;
    setUrl('/');
  });

  it('stays absent from the regular public experience', () => {
    render(<PaletteLab />);

    expect(screen.queryByRole('button', { name: 'השוואת צבעים' })).not.toBeInTheDocument();
  });

  it('shows six choices, applies a selection and resets to the original', () => {
    setUrl('/?paletteLab=1');
    render(<PaletteLab />);

    fireEvent.click(screen.getByRole('button', { name: 'השוואת צבעים' }));
    const options = screen.getAllByRole('button', { pressed: false });
    expect(options).toHaveLength(5);
    expect(screen.getByRole('button', { name: /שזיף ושמפניה/ })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /כחול לילה ונחושת/ }));

    expect(document.documentElement).toHaveAttribute('data-palette', 'midnight-copper');
    expect(window.localStorage.getItem(paletteStorageKey)).toBe('midnight-copper');
    expect(new URL(window.location.href).searchParams.get('palette')).toBe('midnight-copper');
    expect(screen.getByRole('button', { name: /כחול לילה ונחושת/ })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'חזרה למקור' }));
    expect(document.documentElement).not.toHaveAttribute('data-palette');
    expect(new URL(window.location.href).searchParams.has('palette')).toBe(false);
  });

  it('restores storage and copies the exact active palette link', async () => {
    window.localStorage.setItem(paletteStorageKey, 'olive-linen');
    setUrl('/?paletteLab=1');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    render(<PaletteLab />);
    fireEvent.click(screen.getByRole('button', { name: 'השוואת צבעים' }));
    fireEvent.click(screen.getByRole('button', { name: 'העתקת קישור לפלטה' }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]?.[0]).toContain('palette=olive-linen');
    expect(await screen.findByRole('button', { name: 'הקישור הועתק' })).toBeInTheDocument();
  });
});
