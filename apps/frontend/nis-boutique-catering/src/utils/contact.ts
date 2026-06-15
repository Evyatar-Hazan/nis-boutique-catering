import { whatsappBase } from '../data/siteContent';

export const buildWhatsappLink = (message: string): string =>
  `${whatsappBase}?text=${encodeURIComponent(message)}`;

export const buildInquiryWhatsappLink = (topic: string): string =>
  buildWhatsappLink(`שלום Nis, אשמח לשמוע פרטים על ${topic}.`);
