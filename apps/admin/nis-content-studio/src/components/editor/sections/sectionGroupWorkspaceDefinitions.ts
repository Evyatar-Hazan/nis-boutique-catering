import type { ActiveView } from '../../../publishWorkflowHelpers';

export type SectionGroupWorkspaceDefinition = {
  readonly view: ActiveView;
  readonly title: string;
  readonly text: string;
  readonly group: string;
};

export const sectionGroupWorkspaceDefinitions: readonly SectionGroupWorkspaceDefinition[] = [
  {
    view: 'audience',
    title: 'למי זה מתאים',
    text: 'כרטיסים שמסבירים למבקר באתר אם השירות מתאים לו. אם עדיין אין כאלה ב-Sheets, אפשר להוסיף כאן.',
    group: 'audience',
  },
  {
    view: 'site-copy',
    title: 'טקסטי מעטפת',
    text: 'כותרות, תוויות ופתיחים של אזורי האתר. הכותרת היא H2, הטקסט הוא ההסבר, ונקודה ראשונה היא התווית הקטנה מעל הכותרת.',
    group: 'site-copy',
  },
  {
    view: 'site-microcopy',
    title: 'טקסטים קטנים',
    text: 'כפתורים, תוויות בטופס, הודעות וואטסאפ וטקסטי עזר קצרים. השם הפנימי עוזר להבין איפה הטקסט מופיע; השדה טקסט הוא מה שהלקוח יראה.',
    group: 'site-microcopy',
  },
  {
    view: 'process',
    title: 'איך זה עובד',
    text: 'שלבים פשוטים שמסבירים ללקוח מה קורה מהרגע שהוא פונה ועד שהאוכל מוכן.',
    group: 'process',
  },
  {
    view: 'story',
    title: 'הסיפור של המותג',
    text: 'התחנות הקצרות שמופיעות באזור הסיפור: מאיפה Nis באה, מה המטבח מביא, ומה מגיע לשולחן.',
    group: 'story',
  },
  {
    view: 'coordination',
    title: 'תיאום וזמינות',
    text: 'פרטים מעשיים שמרגיעים את הלקוח לפני פנייה: אזור פעילות, זמן פנייה, הצעת מחיר ואישור תפריט.',
    group: 'coordination',
  },
  {
    view: 'faq',
    title: 'שאלות ותשובות',
    text: 'כל כרטיס הוא שאלה באתר. הכותרת היא השאלה, והטקסט הוא התשובה. פתיח האזור מחליף עכשיו גם את מסרי האמון שהיו נפרדים.',
    group: 'faq',
  },
];
