export const buildWhatsappLink = (whatsappBase: string, message: string): string =>
  `${whatsappBase}?text=${encodeURIComponent(message)}`;

export const buildInquiryWhatsappLink = (whatsappBase: string, topic: string): string =>
  buildWhatsappLink(whatsappBase, `שלום Nis, אשמח לשמוע פרטים על ${topic}.`);
