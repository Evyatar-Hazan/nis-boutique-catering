import { describe, expect, it } from 'vitest';

import { buildInquiryWhatsappLink, buildWhatsappLink } from './contact';

describe('WhatsApp contact links', () => {
  it('encodes Hebrew, punctuation and reserved URL characters once', () => {
    const message = 'שלום Nis, שבת & אירוח קטן?';
    const link = buildWhatsappLink(message);

    expect(link).toMatch(/^https:\/\/wa\.me\/972503502615\?text=/u);
    expect(new URL(link).searchParams.get('text')).toBe(message);
  });

  it('builds the approved inquiry sentence for a selected topic', () => {
    const link = buildInquiryWhatsappLink('מארזים לדרך');

    expect(new URL(link).searchParams.get('text')).toBe('שלום Nis, אשמח לשמוע פרטים על מארזים לדרך.');
  });
});
