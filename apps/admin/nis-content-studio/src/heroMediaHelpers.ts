import type { SectionBlockRecord } from '@monorepo/content-schema';

export const heroMediaSlots = [
  { key: 'background', label: 'רקע מסך פתיחה', help: 'התמונה הרחבה שמופיעה מאחורי כל מסך הפתיחה.', fallbackMediaId: 'hosting-table-overview' },
  { key: 'primary', label: 'תמונה ראשית', help: 'התמונה הגדולה באזור התצוגה/האירוח.', fallbackMediaId: 'salmon-skewers-lemon' },
  { key: 'side', label: 'תמונה צדדית', help: 'תמונה קטנה שמוסיפה עומק לתצוגת האירוח.', fallbackMediaId: 'dips-tray-close' },
  { key: 'tall', label: 'תמונה גבוהה', help: 'תמונה אנכית נוספת באזור התצוגה.', fallbackMediaId: 'table-setting-blue-gold' },
] as const;

export const heroMediaIdAt = (heroMedia: SectionBlockRecord | undefined, index: number) =>
  heroMedia?.items[index] ?? heroMediaSlots[index]?.fallbackMediaId ?? '';

export const patchHeroMediaId = (
  heroMedia: SectionBlockRecord,
  index: number,
  mediaId: string,
): Partial<SectionBlockRecord> => {
  const items = heroMediaSlots.map((slot, slotIndex) =>
    slotIndex === index ? mediaId : heroMedia.items[slotIndex] ?? slot.fallbackMediaId,
  );
  return { items };
};
