import { describe, expect, it } from 'vitest';
import { contentSnapshotSchema } from '@monorepo/content-schema';
import {
  formatError,
  getDriveFileViewUrl,
  shortSourceId,
  validationErrorText,
} from './studioHelpers';

describe('studioHelpers', () => {
  it('formats known and unknown errors', () => {
    expect(formatError(new Error('failed'))).toBe('failed');
    expect(formatError('x')).toBe('הפעולה נכשלה');
  });

  it('formats validation fallback messages', () => {
    const invalid = contentSnapshotSchema.safeParse({});
    expect(validationErrorText(invalid, [])).toBe('שדה לא תקין: version - Invalid input: expected string, received undefined');

    const valid = contentSnapshotSchema.safeParse({
      version: '1',
      updatedAt: '2026-06-17T00:00:00.000Z',
      settings: {
        phoneDisplay: '050-3502615',
        phoneHref: 'tel:+972503502615',
        email: 'nisboutiquecatering@gmail.com',
        whatsappBase: 'https://wa.me/972503502615',
        siteVersion: 'v0.1.2',
      },
      media: [],
      gallery: [],
      services: [],
      sections: [],
    });

    expect(validationErrorText(valid, ['בעיה ידועה'])).toBe('בעיה ידועה');
  });

  it('builds drive file urls and short ids', () => {
    expect(getDriveFileViewUrl('file 123')).toContain('/file%20123/view');
    expect(shortSourceId('123456789012')).toBe('123456789012');
    expect(shortSourceId('1234567890123456')).toBe('123456...3456');
  });
});
