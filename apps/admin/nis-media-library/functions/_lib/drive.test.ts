// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { isManagedMedia, mediaFileName } from './drive';

describe('mediaFileName', () => {
  it('uses the human description as the searchable Drive filename', () => {
    expect(mediaFileName('מגש אירוח חלבי', 'IMG_2041.JPG', 'image/jpeg'))
      .toBe('מגש אירוח חלבי.jpg');
  });

  it('removes characters that are confusing in filenames', () => {
    expect(mediaFileName('אירוע / שישי: משפחתי', 'photo.webp', 'image/webp'))
      .toBe('אירוע שישי משפחתי.webp');
  });
});

describe('isManagedMedia', () => {
  it('accepts only marked image files', () => {
    expect(isManagedMedia({
      appProperties: { nisCateringMedia: 'true' },
      mimeType: 'image/jpeg',
    })).toBe(true);
    expect(isManagedMedia({
      appProperties: {},
      mimeType: 'image/jpeg',
    })).toBe(false);
    expect(isManagedMedia({
      appProperties: { nisCateringMedia: 'true' },
      mimeType: 'application/pdf',
    })).toBe(false);
  });
});
