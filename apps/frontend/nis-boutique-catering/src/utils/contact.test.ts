import { describe, expect, it } from 'vitest';
import { businessContact } from '@monorepo/content-schema';

import { buildInquiryWhatsappLink, buildWhatsappLink } from './contact';

describe('WhatsApp contact links', () => {
  it('encodes Hebrew, punctuation and reserved URL characters once', () => {
    const message = 'שלום Nis, שבת & אירוח קטן?';
    const link = buildWhatsappLink(message);

    expect(link.startsWith(`${businessContact.whatsappBase}?text=`)).toBe(true);
    expect(new URL(link).searchParams.get('text')).toBe(message);
  });

  it('builds the approved inquiry sentence for a selected topic', () => {
    const link = buildInquiryWhatsappLink('מארזים לדרך');

    expect(new URL(link).searchParams.get('text')).toBe('שלום Nis, אשמח לשמוע פרטים על מארזים לדרך.');
  });
});
