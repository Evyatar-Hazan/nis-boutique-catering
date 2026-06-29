import { describe, expect, it } from 'vitest';
import { buildInquiryWhatsappLink, buildWhatsappLink } from './contactHelpers';

describe('contactHelpers', () => {
  it('builds whatsapp links from a provided base', () => {
    expect(buildWhatsappLink('https://wa.me/972500000000', 'שלום Nis')).toContain('text=');
    expect(buildInquiryWhatsappLink('https://wa.me/972500000000', 'מגשי אירוח')).toContain('מגשי');
  });
});
