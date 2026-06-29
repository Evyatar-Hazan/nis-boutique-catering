import { describe, expect, it } from 'vitest';
import { heroMediaIdAt, heroMediaSlots, patchHeroMediaId } from './heroMediaHelpers';

describe('heroMediaHelpers', () => {
  it('returns fallback ids when hero media is missing', () => {
    expect(heroMediaIdAt(undefined, 0)).toBe(heroMediaSlots[0].fallbackMediaId);
    expect(heroMediaIdAt(undefined, 3)).toBe(heroMediaSlots[3].fallbackMediaId);
  });

  it('keeps existing ids and patches only the requested slot', () => {
    const heroMedia = {
      id: 'hero-media',
      group: 'hero-media',
      title: 'Hero',
      items: ['custom-background'],
      active: true,
      order: 1,
      updatedAt: '2026-06-29T00:00:00.000Z',
    };

    expect(heroMediaIdAt(heroMedia, 0)).toBe('custom-background');
    expect(patchHeroMediaId(heroMedia, 1, 'custom-primary')).toEqual({
      items: ['custom-background', 'custom-primary', heroMediaSlots[2].fallbackMediaId, heroMediaSlots[3].fallbackMediaId],
    });
  });
});
