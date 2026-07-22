export const paletteIds = [
  'original',
  'olive-linen',
  'bordeaux-terracotta',
  'midnight-copper',
  'forest-butter',
  'stone-coral',
] as const;

export type PaletteId = (typeof paletteIds)[number];

export interface PaletteOption {
  readonly id: PaletteId;
  readonly name: string;
  readonly description: string;
}

export const paletteOptions: readonly PaletteOption[] = [
  {
    id: 'original',
    name: 'שזיף ושמפניה',
    description: 'הפלטה הנוכחית — דרמטית, חמה ואלגנטית.',
  },
  {
    id: 'olive-linen',
    name: 'זית ופשתן',
    description: 'טבעית, שקטה ומוקפדת עם תחושה קולינרית.',
  },
  {
    id: 'bordeaux-terracotta',
    name: 'בורדו וטרקוטה',
    description: 'עשירה, חגיגית וחמה עם אופי ים־תיכוני.',
  },
  {
    id: 'midnight-copper',
    name: 'כחול לילה ונחושת',
    description: 'יוקרתית, עמוקה ומודרנית עם ניגוד חד.',
  },
  {
    id: 'forest-butter',
    name: 'ירוק יער וחמאה',
    description: 'רעננה, נדיבה וביתית בלי להרגיש כפרית.',
  },
  {
    id: 'stone-coral',
    name: 'אבן וקורל',
    description: 'בהירה, נשית ועכשווית עם חמימות מאוזנת.',
  },
] as const;

export const isPaletteId = (value: string | null): value is PaletteId =>
  value !== null && paletteOptions.some(({ id }) => id === value);
