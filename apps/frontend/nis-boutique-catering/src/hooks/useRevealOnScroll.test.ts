import { describe, expect, it } from 'vitest';

import {
  applyScrollAnimationConfig,
  applyStaggerDelays,
  markRevealHidden,
  markRevealVisible,
  readScrollAnimationConfig,
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

  it('reads bounded per-element configuration without unsafe values', () => {
    const element = document.createElement('div');
    element.dataset.revealDelay = '75';
    element.dataset.revealDuration = '9000';
    element.dataset.revealOnce = 'false';
    element.dataset.revealThreshold = '0.35';

    expect(readScrollAnimationConfig(element)).toEqual({
      delay: 75,
      duration: 1200,
      once: false,
      threshold: 0.35,
    });

    applyScrollAnimationConfig(element);
    expect(element.style.getPropertyValue('--delay')).toBe('75ms');
    expect(element.style.getPropertyValue('--reveal-duration')).toBe('1200ms');
  });

  it('applies a capped stagger only when an item has no explicit delay', () => {
    const container = document.createElement('div');
    container.dataset.revealStagger = '45';
    container.innerHTML = '<div class="reveal"></div><div class="reveal" style="--delay: 20ms"></div><div class="reveal"></div>';

    applyStaggerDelays(container);
    const items = container.querySelectorAll<HTMLElement>('.reveal');

    expect(items[0]?.style.getPropertyValue('--delay')).toBe('0ms');
    expect(items[1]?.style.getPropertyValue('--delay')).toBe('20ms');
    expect(items[2]?.style.getPropertyValue('--delay')).toBe('90ms');
  });

  it('can reset a repeatable reveal without removing it from the accessibility tree', () => {
    const element = document.createElement('article');
    element.textContent = 'תוכן נגיש';
    markRevealVisible(element);

    markRevealHidden(element);

    expect(element.dataset.revealVisible).toBe('false');
    expect(element).not.toHaveClass('is-visible');
    expect(element.textContent).toBe('תוכן נגיש');
    expect(element).not.toHaveAttribute('aria-hidden');
  });
});
