import { describe, expect, it } from 'vitest';
import { buildInquiryWhatsappLink, buildWhatsappLink } from './contactHelpers';

describe('contactHelpers', () => {
  it('builds whatsapp links from a provided base', () => {
    expect(buildWhatsappLink('https://wa.me/972500000000', 'שלום Nis')).toContain('text=');
    const inquiryUrl = new URL(buildInquiryWhatsappLink('https://wa.me/972500000000', 'מגשי אירוח'));
    expect(inquiryUrl.searchParams.get('text')).toContain('מגשי אירוח');
  });
});
