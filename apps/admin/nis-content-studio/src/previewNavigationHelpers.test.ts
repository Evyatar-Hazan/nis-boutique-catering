import { describe, expect, it } from 'vitest';
import { getViewForUsage } from './previewNavigationHelpers';

describe('previewNavigationHelpers', () => {
  it('maps media usage kinds to their editor views', () => {
    expect(getViewForUsage('gallery')).toBe('media');
    expect(getViewForUsage('service')).toBe('services');
    expect(getViewForUsage('manifesto')).toBe('manifesto');
    expect(getViewForUsage('hero')).toBe('hero');
  });
});
