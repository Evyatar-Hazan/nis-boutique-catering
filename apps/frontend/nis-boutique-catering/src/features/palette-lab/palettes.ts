export const paletteIds = [
  'bordeaux-terracotta',
  'original',
  'olive-linen',
  'midnight-copper',
  'forest-butter',
  'stone-coral',
] as const;

export type PaletteId = (typeof paletteIds)[number];
export const defaultPaletteId: PaletteId = 'bordeaux-terracotta';

export interface PaletteOption {
  readonly id: PaletteId;
  readonly name: string;
  readonly description: string;
}

export const paletteOptions: readonly PaletteOption[] = [
  {
    id: 'bordeaux-terracotta',
    name: 'בורדו וטרקוטה',
    description: 'ברירת המחדל שנבחרה — עשירה, חגיגית וחמה.',
  },
  {
    id: 'original',
    name: 'שזיף ושמפניה',
    description: 'הפלטה הקודמת — דרמטית, חמה ואלגנטית.',
  },
  {
    id: 'olive-linen',
    name: 'זית ופשתן',
    description: 'טבעית, שקטה ומוקפדת עם תחושה קולינרית.',
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
