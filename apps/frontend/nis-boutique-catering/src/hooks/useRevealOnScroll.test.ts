import { describe, expect, it } from 'vitest';

import { shouldRevealEntry } from './useRevealOnScroll';

const entryAt = (bottom: number, isIntersecting = false) => ({
  boundingClientRect: { bottom } as DOMRectReadOnly,
  isIntersecting,
});

describe('scroll reveal policy', () => {
  it('reveals intersecting elements and elements skipped above the viewport', () => {
    expect(shouldRevealEntry(entryAt(400, true))).toBe(true);
    expect(shouldRevealEntry(entryAt(-1))).toBe(true);
    expect(shouldRevealEntry(entryAt(400))).toBe(false);
  });
});
