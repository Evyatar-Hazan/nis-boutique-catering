import { describe, expect, it } from 'vitest';

import { businessContact } from './contact';

describe('businessContact', () => {
  it('derives every phone and WhatsApp representation from the canonical national number', () => {
    expect(businessContact.phoneDisplay.replace('-', '')).toBe(businessContact.phoneNational);
    expect(businessContact.phoneHref).toBe(`tel:${businessContact.phoneE164}`);
    expect(businessContact.whatsappBase).toBe(`https://wa.me/${businessContact.phoneE164.slice(1)}`);
  });
});
