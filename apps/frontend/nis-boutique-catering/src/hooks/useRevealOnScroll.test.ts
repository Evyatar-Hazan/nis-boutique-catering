import { describe, expect, it } from 'vitest';

import {
  markRevealVisible,
  restoreRevealVisibility,
  shouldRevealEntry,
} from './useRevealOnScroll';

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

  it('restores visibility when a React rerender rewrites the class attribute', () => {
    const element = document.createElement('section');
    element.className = 'reveal';

    markRevealVisible(element);
    element.className = 'reveal';
    restoreRevealVisibility(element);

    expect(element.dataset.revealVisible).toBe('true');
    expect(element).toHaveClass('is-visible');
  });
});
