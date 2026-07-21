import { afterEach, describe, expect, it } from 'vitest';

import { getActiveNavSection } from './useScrollState';

const appendSection = (id: string, offsetTop: number) => {
  const section = document.createElement('section');
  section.id = id;
  Object.defineProperty(section, 'offsetTop', { configurable: true, value: offsetTop });
  document.body.append(section);
};

describe('scroll navigation state', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('discovers deferred sections after the initial render', () => {
    const sectionIds = ['top', 'experiences', 'gallery'] as const;
    appendSection('top', 0);

    expect(getActiveNavSection(sectionIds, 700)).toBe('#top');

    appendSection('experiences', 300);
    appendSection('gallery', 600);

    expect(getActiveNavSection(sectionIds, 700)).toBe('#gallery');
  });
});
