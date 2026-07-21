---
title: NIS Public Site Redesign Tracker
status: active
owner: Evyatar Hazan
created: 2026-07-20
updated: 2026-07-22
source_of_truth: true
implementation_gate: ready
---

# NIS Public Site Redesign — Source of Truth and Execution Tracker

מסמך זה הוא מקור האמת המחייב לתכנון, לביצוע, לאימות ולסגירת השינוי הקרוב באתר הציבורי של NIS Boutique Catering.

מטרת השינוי היא להפוך את האתר הנוכחי למסלול קצר, ברור וממוקד פנייה: להבין מה Nis מציעה, לבחור סוג אירוח, להתרשם מהתוצרים, להבין את תהליך ההזמנה ולפנות ב־WhatsApp.

## כלל עבודה מחייב

לפני כל שינוי הקשור לתכנון או למימוש:

1. לקרוא את המסמך הזה מחדש.
2. לזהות את המשימה המדויקת שעליה עובדים ואת התלויות שלה.
3. לוודא שהמשימה מסומנת `READY` לפני שינוי קוד.
4. לשנות את הסטטוס ל־`IN_PROGRESS` ולתעד את נקודת הפתיחה.

אחרי כל שינוי:

1. לעדכן את סטטוס המשימה.
2. לתעד קבצים ששונו והחלטות שהתקבלו.
3. לתעד את הבדיקות שבוצעו ואת התוצאות בפועל.
4. לא לסמן משימה `DONE` עד שכל תנאי הקבלה הושלמו ויש ראיות.
5. להוסיף רשומה ל־Change Log בסוף המסמך.

החרגה יחידה: יצירת המסמך הראשונית היא פעולת bootstrap ולכן לא היה קובץ קודם שניתן היה לקרוא לפניה.

## שער מימוש גלובלי

**סטטוס נוכחי: `READY`**

כל 56 המשימות הקודמות הושלמו ואומתו בפרודקשן. לבקשת המשתמש נפתחה `UI-010` להסרת הווידאו מהגלריה ולחיזוק תנועת הגלילה של התמונות בלבד; שער המימוש פתוח למשימה זו בלבד.

תוכנית השרת/קליינט, בניית מסך האדמין מחדש והמעבר מ־Google Sheets/Drive ל־Cloudflare D1/R2 נוספו למסמך ב־2026-07-20. שער המימוש נפתח לאחר השלמת:

- `GOV-002` — baseline מלא של repository ו־production.
- `ARC-001`–`ARC-004` — contracts, ownership ומיפוי migration סופי.
- הכרעות התוכן וה־UI המסומנות כ־blockers בטבלת ההחלטות.
- `GOV-004` — Impact Review ועדכון מפורש של השער ל־`READY`.

סדר הביצוע המאושר מונע עבודה זמנית: Design system → חלקי public שאינם תלויי backend → Cloudflare foundation/API/media/publish/build → migration preview → admin rebuild → cutover production → השלמת public gallery → QA/release. כל cutover או retire עדיין כפוף לתלות ולאישור המפורש שמוגדר במשימה שלו.

## סטטוסים מותרים

| Status | Meaning |
|---|---|
| `BACKLOG` | מוגדר אך עדיין אינו מוכן לביצוע |
| `BLOCKED` | חסר מידע, החלטה או תלות |
| `READY` | מוגדר במלואו וכל התלויות נסגרו |
| `IN_PROGRESS` | נמצא כעת בביצוע |
| `VERIFYING` | המימוש הסתיים ונמצא בבדיקות |
| `DONE` | כל תנאי הקבלה והאימות הושלמו |
| `CANCELLED` | בוטל בהחלטה מתועדת |

## עקרונות שאינם נתונים למשא ומתן

### איכות וארכיטקטורה

- אין לשכפל קוד, לוגיקה, סגנונות או קומפוננטות.
- לפני יצירת קומפוננטה, hook, utility, type או package חדש יש לבדוק אם יכולת מתאימה כבר קיימת.
- קוד או UI שחוזרים ביותר ממקום אחד עוברים להפשטה גנרית ברורה עם API קטן, טיפוסים מפורשים ובדיקות.
- קומפוננטה לא טריוויאלית נשמרת בקובץ ייעודי; אין להפוך `App.tsx` או קובץ section מרכזי למונולית חדש.
- יש להעדיף שימוש והרחבה של `packages/site-preview` ושל `packages/content-schema` לפני יצירת שכבה משותפת נוספת.
- גבולות package נשארים חד־כיווניים וברורים; אין circular dependencies, deep imports או תלות הפוכה מהחבילות המשותפות באפליקציות.
- אין לשבור public API קיים בלי מיפוי צרכנים, תוכנית מעבר ובדיקות.

### TypeScript

- TypeScript נשאר strict.
- אין להשתמש ב־`any`; כאשר הטיפוס אינו ידוע משתמשים ב־`unknown` ומבצעים narrowing בטוח.
- מודל הנתונים צריך לייצג את חוקי העסק, כולל readonly properties ו־discriminated unions כאשר הם מתאימים.
- אין type assertions לא בטוחים לצורך עקיפת schema או שגיאת קומפיילר.
- חוזי תוכן משותפים מוגדרים פעם אחת ב־`packages/content-schema` ונצרכים על ידי האתר, הסטודיו וסקריפטי הסנכרון.

### מקור אמת לתוכן

- **מצב חי סופי:** Cloudflare D1 הוא מקור האמת לתוכן, אדמינים, sessions וגרסאות פרסום; Cloudflare R2 הוא מקור האמת לקובצי מדיה מקוריים.
- Google משמש להזדהות בלבד ואינו מחזיק הרשאות קריאה או כתיבה לתוכן.
- `packages/content-schema` נשאר החוזה הטיפוסי היחיד בין API, סטודיו, build והאתר הציבורי.
- קובצי generated, fallback וה־assets המותאמים שנוצרים ב־build הם תוצרים נגזרים בלבד, לא משטח עריכה נוסף.
- אין שני מקורות אמת פעילים: D1/R2 בלבד authoritative; גיבוי ההגירה הישן נשמר לקריאה בלבד לצורך התאוששות וביקורת.
- הסרת חלק אינה מסתכמת בהסתרת UI: יש לטפל ב־schema, ב־D1, בסטודיו, ב־build sync, ב־preview ובקומפוזיציית האתר כדי שהחלק לא יחזור.

### Completion

- הצלחה מקומית אינה מספיקה לשינוי deploy-sensitive.
- סדר האימות המחייב: validation מקומי → בדיקות דפדפן → push מאושר → CI → deploy → אימות production.
- לא ממציאים המלצות לקוחות, נתוני אמון, שעות פעילות או טענות עסקיות.
- אין לשנות production, לבצע commit או push ללא הוראה מפורשת בשלב הביצוע.

## מטרת המוצר

האתר צריך לענות לפי הסדר על שש שאלות:

1. מה Nis מציעה?
2. מה אפשר להזמין?
3. איך האוכל והאירוח נראים בפועל?
4. איך מתבצע התהליך?
5. למה לבחור ב־Nis?
6. איך יוצרים קשר ומתקדמים להזמנה?

המסלול הרצוי:

`הבנה → בחירה → הוכחה חזותית → הסרת חוסר ודאות → אמון → פנייה`

## Scope

### In scope

- צמצום האתר הציבורי מ־12 חלקים לשישה חלקים מרכזיים.
- איחוד תוכן כפול והסרת מסרים חוזרים.
- בנייה מחדש של היררכיית התוכן והניווט.
- רענון מלא של UI, responsive behavior, typography, motion ו־accessibility.
- התאמת חוזי התוכן, Sheets, generated snapshots וה־preview למבנה החדש.
- הוספת API מאובטח ב־Cloudflare Pages Functions תחת משטח הסטודיו.
- העברת תוכן ואדמינים מ־Google Sheets ל־Cloudflare D1.
- העברת מדיה מ־Google Drive ל־Cloudflare R2.
- החלפת גישת Google OAuth ישירה למשאבי תוכן ב־Google Sign-In לצורך זיהוי בלבד, session שרתי והרשאה ב־API.
- שמירת האתר הציבורי כאתר סטטי שנבנה מתוכן published בלבד.
- בדיקות יחידה, אינטגרציה, נגישות, responsive, ביצועים ו־production.
- שמירה על מסלול הפנייה הקיים ל־WhatsApp.

### Out of scope

- PostgreSQL, שרת Node קבוע או שירות CMS חיצוני בתשלום.
- הפיכת האתר הציבורי ל־SPA שמושך תוכן runtime בכל טעינה; הוא נשאר static-first.
- איחוד האתר הציבורי והסטודיו לפרויקט Pages אחד ללא צורך מוצרי מוכח.
- שמירת Base64 או binary ב־D1.
- שמירת Google access token בדפדפן לצורך גישה ל־Sheets/Drive לאחר ה־cutover.
- הוספת contact-message database או מערכת הזמנות חדשה; מסלול הפנייה נשאר WhatsApp בשינוי הזה.
- התחלת מימוש כלשהו לפני סגירת שער המימוש הגלובלי.

## Information Architecture מאושר לתכנון

### 1. Hero — פתיחה

**מטרה:** להבהיר בתוך שניות מה Nis מציעה ולהוביל לפנייה אחת ברורה.

**תוכן מתוכנן:**

- כותרת מוצעת: `אירוח שנראה מוקפד ומרגיש ביתי.`
- תיאור קצר: אוכל לשבת, אירוח קטן ומארזים לדרך בהתאמה אישית.
- CTA ראשי: פנייה ב־WhatsApp.
- CTA משני: מעבר לגלריה.
- שלוש נקודות ערך בלבד: הכנה טרייה, הגשה מוכנה, תיאום אישי.

**UI:**

- Desktop: תוכן מימין ותמונת אוכל מרכזית אחת משמאל.
- Mobile: תמונה, כותרת, תיאור ו־CTA בסדר קריאה אחד.
- ללא collage צפוף וללא וידאו אוטומטי כחלק מרכזי.
- יעד גובה: כ־80% viewport, בלי לעכב את יתר התוכן.

### 2. Services — מה אפשר להזמין

**מטרה:** לאפשר בחירה מהירה בין שלוש הצעות ברורות.

**קטגוריות:**

- אוכל לשבת.
- אירוח קטן.
- מארזים לדרך.

**UI:**

- כרטיס לכל שירות עם תמונה, שם, הסבר קצר, התאמה ו־CTA.
- Desktop: שלושה כרטיסים בשורה.
- Mobile: רשימה אנכית מלאה; אין carousel שמסתיר אפשרויות.
- CTA של שירות פותח הודעת WhatsApp עם הקשר השירות שנבחר.

### 3. Gallery — גלריה ותוצרים אמיתיים

**מטרה:** לבנות אמון דרך תוצרים אמיתיים במקום טקסט שיווקי נוסף.

**תוכן מתוכנן:**

- 6–9 תמונות נבחרות בטעינה הראשונית.
- וידאו קצר אחד מתוך הכנה או אירוח אמיתי.
- סינון מצומצם: הכול, שולחנות, מגשים ומנות.
- lightbox נגיש לתמונות.
- CTA לאחר ההוכחה החזותית.

**UI:**

- תמונה מובילה אחת וגריד משלים.
- אין section נפרד לווידאו.
- מדיה מתחת לקפל נטענת ב־lazy loading עם dimensions שמורים למניעת CLS.

### 4. Process — איך מזמינים

**מטרה:** להסיר חוסר ודאות ולהמחיש תהליך קצר.

**שלבים:**

1. שולחים פרטים ב־WhatsApp.
2. מדייקים סוג אירוח, תאריך וכמות.
3. Nis מכינה ואורזת את ההזמנה.
4. איסוף או משלוח בהתאם לתיאום.

**UI:**

- Desktop: ארבעה שלבים בשורה עם קשר חזותי עדין.
- Mobile: timeline אנכי.
- אזור מידע משלים כולל אזור פעילות, אופן קבלה ותיאום מראש.

### 5. Trust — למה לבחור ב־Nis

**מטרה:** לבנות אמון סביב האוכל, ההגשה והשירות.

**תוכן מתוכנן:**

- אוכל טרי ומוקפד.
- הגשה אסתטית שמוכנה לשולחן.
- התאמה אישית ושירות אנושי.
- תמונת אוכל, מארז או שולחן מוגמר.
- המלצות יוצגו רק אם קיימות המלצות אמיתיות ומאומתות.

**החלטה מחייבת:**

- אין להשתמש בתמונה של יהודית כאלמנט מרכזי.
- אין section ביוגרפי ארוך.
- אם נדרש, סיפור המותג מצטמצם למשפט קצר שאינו מתחרה בתוצרים.

### 6. Contact — שאלות ויצירת קשר

**מטרה:** לסגור את המסלול בפנייה קצרה ללא עומס.

**תוכן מתוכנן:**

- 3–4 שאלות נפוצות בלבד.
- טופס קצר עם שם, טלפון, סוג הזמנה ושדות אופציונליים לתאריך/כמות והערה.
- שליחת הטופס פותחת הודעת WhatsApp מוכנה.
- דרכי קשר ישירות נשארות זמינות.

**UI:**

- Desktop: FAQ וטופס בשתי עמודות.
- Mobile: FAQ מקוצר ולאחריו הטופס.
- labels גלויים, validation ליד השדה ו־focus על השגיאה הראשונה.
- CTA ראשי אחד: `המשיכו ל־WhatsApp`.

## מיפוי מהמבנה הקיים לחדש

| Existing | Target | Required action |
|---|---|---|
| Hero + Intro Band + Manifesto + Audience | Hero | למזג מסרים ולהסיר sections עצמאיים |
| Experience Lab | Services | לפשט לשלושה כרטיסי שירות ברורים |
| Gallery + Real Media | Gallery | לאחד תמונות ווידאו לאזור אחד |
| Process + Coordination | Process | למזג תהליך ותיאום |
| Story | Trust | לקצר, להסיר תמונת בעלים ולהתמקד בהוכחות |
| FAQ + Contact | Contact | לאחד שאלות ופנייה |

## UI System

### Direction

- כיוון: editorial boutique, warm, premium, food-first.
- מבנה: עמוד יחיד, mobile-first, מעט sections, הרבה whitespace ו־CTA מרכזי עקבי.
- אין לאמץ פלטת שחור־כתום גנרית; משתמשים בזהות NIS הקיימת.

### Color tokens

| Token | Value | Use |
|---|---|---|
| Espresso | `#110D10` | Hero, footer, primary surfaces |
| Ivory | `#FFFAF6` | Text on dark, light surface |
| Cream | `#F5ECE4` | Main background |
| Rose | `#A04A57` | Brand accent |
| Gold | `#D8BB84` | Premium detail and focus accents |
| Sage | `#597361` | Secondary detail only |

צבעי functional state חייבים להיות tokens סמנטיים נפרדים ולא שימוש מחדש בצבעי המותג.

### Typography

- כותרות עברית: `Frank Ruhl Libre` או `Noto Serif Hebrew`; ההחלטה הסופית תתקבל לאחר בדיקת rendering וביצועים.
- גוף וכפתורים: `Assistant`.
- אין להשתמש ב־`Playfair Display` עבור טקסט עברי ללא fallback עברי מוגדר ומאומת.
- Hero desktop: `48–64px`; mobile: `36–42px`.
- Section heading desktop: `36–44px`; mobile: `28–34px`.
- Body desktop: `17–18px`; mobile: `16px`; line-height `1.5–1.75`.
- טקסט ארוך מוגבל לכ־65–75 תווים בשורה.

### Layout and spacing

- Container: עד `1180px`.
- Section spacing: `88–104px` desktop; `56–72px` mobile.
- Spacing scale: מכפלות של `4px`/`8px` בלבד.
- Touch target: לפחות `44×44px`; כפתור ראשי לפחות `48px` גובה.
- Radius: `10–14px` לרכיבים עיקריים, בסולם עקבי.
- shadows עדינים מתוך token scale משותף; אין ערכים אקראיים לכל כרטיס.

### Navigation

- קישורים בלבד: שירותים, גלריה, איך מזמינים, יצירת קשר.
- CTA קבוע ל־WhatsApp.
- Mobile: logo, WhatsApp ו־menu קומפקטי לארבעה יעדים בלבד.
- active state, focus state ו־anchor offsets נבדקים בכל breakpoint.

### Motion

- transitions בטווח `180–280ms`.
- animation רק כאשר היא מסבירה שינוי state או היררכיה.
- להסיר CTA breathing מתמשך ואפקטים דקורטיביים שמושכים תשומת לב מהתוכן.
- transform/opacity בלבד לאנימציות שוטפות.
- תמיכה מלאה ב־`prefers-reduced-motion`.

### Accessibility

- יחס ניגודיות WCAG AA לפחות.
- היררכיית headings רציפה.
- keyboard navigation מלאה לניווט, tabs, gallery, lightbox, FAQ וטופס.
- focus rings גלויים.
- alt text משמעותי למדיה אמיתית ו־alt ריק למדיה דקורטיבית.
- אין העברת משמעות באמצעות צבע בלבד.
- modal/lightbox מחזיר focus לטריגר ונסגר ב־Escape.

## Baseline היסטורי וארכיטקטורה חיה

הטבלאות הבאות מתעדות את נקודת הפתיחה ואת הפער שנסגר. הן היסטוריות ואינן מתארות את ה־runtime הנוכחי; הארכיטקטורה החיה היא D1/R2 עם Google Identity בלבד.

### מה כבר קיים ועובד

| שכבה | baseline לפני השינוי | קבצים/מערכות מרכזיים באותה נקודת זמן |
|---|---|---|
| אתר ציבורי | React/Vite סטטי על Cloudflare Pages; התוכן והמדיה נאספים בזמן build | `apps/frontend/nis-boutique-catering`, `scripts/sync-content.mjs` |
| סטודיו | React/Vite נפרד על Cloudflare Pages | `apps/admin/nis-content-studio` |
| חוזה תוכן | Zod + TypeScript משותפים | `packages/content-schema` |
| תוכן | הדפדפן קורא וכותב ישירות ל־Google Sheets עם Google access token | `src/googleApi.ts` |
| מדיה | הדפדפן מעלה ל־Google Drive; ה־build מוריד וממיר ל־WebP סטטי | `uploadImageToDrive`, `sync-content.mjs` |
| הרשאה | Google OAuth בדפדפן, allowlist ב־Sheets/env ו־metadata ב־`sessionStorage` | `useStudioAuthSession.ts`, `studioAdmins.ts` |
| פרסום | Apps Script מאמת משתמש Google ומפעיל `workflow_dispatch` ב־GitHub | `tools/google-apps-script/publish-proxy.gs` |
| Deploy | GitHub Actions בונה ומעלה שני פרויקטי Pages נפרדים | `.github/workflows/cloudflare-pages.yml` |

### הפער ההיסטורי שנסגר

| נושא | הפער | השינוי הדרוש |
|---|---|---|
| API שרתי | אין שכבת backend בבעלות הפרויקט בין הדפדפן לנתונים | להוסיף Pages Functions תחת ה־studio ב־`/api/*` |
| אחסון תוכן | Sheets הוא datastore חיצוני והלקוח מחזיק הרשאות כתיבה | להעביר snapshots, revisions, admins ו־sessions ל־D1 |
| אחסון מדיה | Drive דורש OAuth scopes, Picker ושירות account בזמן build | להעביר originals ל־R2 ולשמור ב־D1 רק object key ומטא־דאטה |
| session | Google access token הוא יכולת הגישה בפועל ואין session שרתי revocable | לאמת Google ID token בשרת וליצור cookie חתום/אקראי, קצר־חיים ו־revocable |
| הרשאה | חלק מההרשאה מתבצע בלקוח; ביישום הייחוס יש גם מסלול email bearer שאסור להעתיק | כל endpoint ניהולי בודק session ואדמין פעיל מתוך D1 |
| publish | תלות ב־Apps Script וב־Sheets/Drive | endpoint שרתי יפרסם revision אטומי ויפעיל את workflow הקיים |
| build sync | CI תלוי ב־Google service account | CI יוריד published snapshot והמדיה המתייחסת אליו מה־API/R2 |
| migrations | אין D1 migrations או seed/rollback | להוסיף migrations versioned ולהריץ אותן לפני deploy |
| media upload | יישום הייחוס מחזיר Base64 בחלק מהמסלול; זה אינו מימוש R2 מלא | stream ישיר ל־R2 עם מגבלת גודל/type; לעולם לא Base64 ב־D1/JSON |

### ארכיטקטורת היעד המאושרת לתכנון

```text
Admin Browser (studio.nisboutiquecatering.com)
        │ Google ID token פעם אחת בכניסה
        ▼
Cloudflare Pages + Pages Functions /api/*
        │  HttpOnly Secure SameSite session cookie
        ├──────────────► D1: admins, sessions, content revisions, publish jobs, media metadata
        ├──────────────► R2: original media objects
        └──────────────► GitHub workflow_dispatch on publish
                              │
                              ▼
                    Static public-site build
                    published snapshot + referenced R2 media
                              │ optimize to responsive assets
                              ▼
                 Cloudflare Pages: nisboutiquecatering.com
```

ההתאמה לפרויקט שלנו שומרת על שני פרויקטי Pages קיימים במקום לאחד אותם: האתר הציבורי נשאר static-first ומהיר, וה־studio מקבל Pages Functions co-located ו־same-origin. כך אין CORS פתוח ל־admin, אין שרת קבוע ואין צורך ב־PostgreSQL.

### חוזה הנתונים המוצע

ה־CMS קטן וצורך snapshot שלם. לכן נשמור ב־D1 revisions אטומיים של `ContentSnapshot` במקום לפצל את אותו מידע לעשרות טבלאות ולשכפל mapping בכל שכבה:

| Table | אחריות | שדות עיקריים |
|---|---|---|
| `admins` | allowlist וניהול אדמינים | `id`, `email`, `google_subject`, `display_name`, `is_active`, timestamps |
| `admin_sessions` | sessions ניתנים לביטול | `id`, `token_hash`, `admin_id`, `expires_at`, `revoked_at`, timestamps |
| `content_revisions` | draft/published/archived snapshots | `id`, `status`, `schema_version`, `content_json`, `created_by`, timestamps |
| `media_assets` | metadata בלבד; reference ל־R2 | `id`, `object_key`, `mime_type`, `size_bytes`, dimensions, hash, alt, timestamps |
| `publish_jobs` | audit וסטטוס dispatch/deploy | `id`, `revision_id`, `requested_by`, `status`, `github_run_id`, error, timestamps |

כל `content_json` חייב לעבור `contentSnapshotSchema.parse` לפני write ואחרי read. הוא מכיל `mediaId` יציב, לא Base64 ולא URL זמני. מחיקה של מדיה היא soft delete תחילה; object נמחק מ־R2 רק אחרי בדיקה שאין revision פעיל שמפנה אליו ותקופת grace מוגדרת.

### Auth ו־security

1. הלקוח מקבל Google ID token דרך Google Identity Services ושולח אותו פעם אחת ל־`POST /api/auth/google`.
2. ה־Function מאמת signature דרך Google JWKS וגם `issuer`, ‏`audience`, ‏`exp` ו־`email_verified`.
3. בכניסה הראשונה כתובת המייל המאומתת חייבת להתאים ל־admin פעיל ב־D1; לאחר מכן נשמר גם `sub` של Google כמזהה הזהות היציב ונבדקת התאמתו.
4. השרת יוצר token אקראי, שומר רק hash ב־D1 ומחזיר cookie עם `HttpOnly`, ‏`Secure`, ‏`SameSite=Strict`, ‏`Path=/` ו־expiry קצר.
5. כל mutation בודק session, ‏`Origin`/CSRF, content type, payload size ו־schema. logout או השבתת אדמין מבטלים sessions.
6. secrets כגון Google client ID, GitHub token ו־session pepper מוגדרים ב־Cloudflare/GitHub secrets; הם אינם `VITE_*` ואינם נכנסים ל־bundle.
7. אין `Access-Control-Allow-Origin: *` ל־admin API ואין email bearer לא חתום.

### Draft, publish והאתר הציבורי

- שמירת טיוטה יוצרת revision חדש או מעדכנת draft יחיד באמצעות optimistic concurrency/version check; היא אינה משנה את האתר החי.
- Publish מאמת שוב את כל ה־snapshot, הופך revision אחד ל־published בתוך transaction לוגי, מארכב את הקודם ויוצר `publish_job`.
- ה־Function מפעיל את GitHub Action הקיים. ה־build מוריד רק `published` snapshot ואת קובצי R2 שאליהם הוא מפנה, מייצר WebP/variants ומשאיר את כל המדיה הציבורית כ־static assets של Pages.
- endpoint הקריאה ל־published content הוא read-only, versioned, עם `ETag`; ניתן להשאירו ציבורי כי תוכנו ממילא ציבורי, או להגן עליו ב־build secret אם יתברר שהוא חושף metadata שאינו מיועד לאתר.
- rollback אינו משנה ידנית rows: הוא מפרסם revision קודם ויוצר publish job חדש, כך שנשמר audit trail.

### Migration ו־cutover ללא אובדן מידע

1. export מלא וחתום של Sheets + רשימת Drive + snapshot generated נוכחי.
2. dry-run transformer שמפיק `ContentSnapshot` ו־media manifest, בלי writes ל־production.
3. יצירת D1/R2 preview, migrations וייבוא ניסיון; השוואת IDs, counts, hashes ו־schema.
4. ייבוא production כאשר Sheets/Drive עדיין authoritative והסטודיו הישן נשאר פעיל.
5. חלון הקפאת כתיבה קצר; delta export אחרון; import; parity check.
6. cutover של ה־studio ל־API החדש, בדיקת owner מלאה, ורק אחר כך cutover של build sync.
7. תקופת rollback שבה Sheets/Drive נשמרים read-only ולא נמחקים.
8. לאחר אישור production: הסרת OAuth scopes ל־Sheets/Drive, Apps Script, service account secrets וקוד legacy.

### Legacy content migration and rollback map

הטבלה הבאה היא מפת ההגירה המחייבת. `ARC-004` מתכננת ומאמתת dry run בלבד; היא אינה משנה את Sheets/Drive או את production. לפני write ראשון יבוצע `MIG-001`, שייצר export חיצוני immutable עם hashes. עד אז שני snapshots הקיימים נשמרים ב־Git, וכל dry run חייב להוכיח שה־SHA שלהם לא השתנה.

| Legacy source | Fields used | V2 destination | ID/default/archive rule |
|---|---|---|---|
| `settings` | phone, email, WhatsApp, SEO | `settings` | העתקה ישירה; `siteVersion` מוסר כי `version` הוא owner יחיד |
| `media[]` | `id`, dimensions, Drive/source metadata | `media[]` + R2 manifest | `id` נשמר; `driveFileId` משמש רק בייבוא; `objectKey`, MIME, bytes ו־checksum מגיעים מ־R2; מדיה שלא נבחרה נשמרת archived |
| `services[]` | title, description, bestFor, cta, mediaId | `sections.services.items[]` | שלושת ה־IDs נשמרים; subtitle/promise/details מוזגים ל־summary או נארכבים בלי שדות כפולים; order מפורש 1–3 |
| `gallery[]` | id, title, alt, category, mediaId, order | `sections.gallery.items[]` | נבחרים 6–9 IDs פעילים; `tables→tables`, ‏`trays→trays`, ‏`salads/fish/coffee→dishes`; יתר הפריטים archived ולא נמחקים |
| `sections:hero` | title, text, items | `sections.hero` | ID רעיוני נשמר; copy מוחלף בנוסח המאושר; אין fallback שמחזיר copy ישן |
| `sections:hero-media` | `items[]` | `sections.hero.mediaId` | נבחר ID תמונה אחד; שאר הרשימה אינה נשמרת ב־Hero |
| `sections:hero-notes` | title/text | `sections.hero.valuePoints[]` | בדיוק שלוש נקודות מאושרות; שתי השורות הישנות הן מקור טיוטה בלבד |
| `sections:hero-marquee` | items | archive | decorative duplicate; אין default ואין renderer ב־v2 |
| `sections:editorial` | title/text/items | `sections.services.items[]` | ממוזג לפי shabbat/events/travel; rows ישנים archived |
| `sections:audience` | title/text | `sections.services.items[].bestFor` | ממוזג לפי אותו service ID; rows ישנים archived |
| `sections:samples` | title/text/items | archive | פירוט תפריט אינו בחוזה public v2; נשמר בארכיון בלבד עד החלטת מוצר עתידית |
| `sections:manifesto` | title/text/media ref | `sections.trust.points[]` | תוכן הוכחה נבחר בלבד; rows ישנים archived ואין section עצמאי |
| `sections:boutique` | title/text | `sections.trust.points[]` | נבחרות בדיוק שלוש נקודות ללא כפילות עם Hero |
| `sections:signature` | title/text | `sections.trust.points[]` או archive | רק טענה מאושרת ולא כפולה יכולה להתמזג; rows ישנים archived |
| `sections:story` | title/text | optional one-line Trust description | אין תמונת יהודית ואין section ביוגרפי; כל rows הישנים archived |
| `sections:process` | title/text/order | `sections.process.steps[]` | ארבעת IDs נשמרים עם order 1–4; הנוסח מתעדכן לתהליך המאושר |
| `sections:coordination` | title/text | `sections.process.operationalNotes[]` | עד שלושה פריטים מאושרים; rows שלא נבחרו archived |
| `sections:faq` | title/text | `sections.contact.faqs[]` | נבחרות 3–4 שאלות מאושרות תוך שמירת ID; יתר השאלות archived |

כללי parity: כל row ישן מופיע פעם אחת במפה כ־destination או archive; אין hard delete בזמן migration; IDs פעילים ו־order ייחודיים; כל media reference מצביע ל־asset קיים; אותו input והחלטות בחירה מפיקים אותו output. Rollback הוא פרסום revision קודמת, לא עריכה הפוכה של rows. `pnpm migration:plan:audit` בודק את שתי תמונות המצב המקומיות, כיסוי כל group, כפילויות, media references, סימולציית archive מבודדת, שחזור והשארת קובצי המקור ללא שינוי.

### התאמה למסלול החינמי של Cloudflare

נכון לבדיקה ב־2026-07-20, הארכיטקטורה מתאימה היטב לאתר קטן: Pages static assets הם חינמיים וללא מגבלת בקשות; Pages Functions נספרים בתוך מכסת Workers Free של 100,000 בקשות ביום; D1 Free כולל 5 מיליון rows read ביום, 100 אלף rows written ביום ו־5GB אחסון; R2 Free כולל 10GB-month, מיליון Class A ו־10 מיליון Class B בחודש וללא egress charge. הפעלת R2 בחשבון עשויה לדרוש השלמת תהליך subscription/checkout גם כשהשימוש נשאר בתוך ה־Free tier. אלה limits ולא התחייבות שהעלות תמיד תהיה אפס, ולכן `CF-010` מוסיף ניטור שימוש ותקציב.

מקורות רשמיים שנבדקו:

- [Pages Functions bindings](https://developers.cloudflare.com/pages/functions/bindings/)
- [Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Pages Functions setup](https://developers.cloudflare.com/pages/functions/get-started/)
- [Pages Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- [Verify the Google ID token on the server](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)

### Component ownership and duplication map

| Capability | Current owner(s) | Target owner | Action |
|---|---|---|---|
| Business content contract and validation | `packages/content-schema` | `packages/content-schema` | לשמור ולהרחיב; אין להגדיר DTO/domain type מקביל באפליקציות |
| Public section rendering | `packages/site-preview` | `packages/site-preview` | לשמר כמימוש היחיד שמשמש public ו־studio preview; לפצל את `MainSections.tsx` לקבצים לפי section בלי לשנות public exports |
| Public composition and browser state | frontend `App.tsx`, `LazySiteSections.tsx` | frontend app | לצמצם לשישה sections; app owns routing/composition בלבד, לא markup של sections |
| Header, footer, floating CTA and lightbox shell | frontend `SiteChrome.tsx` | frontend app + shared primitives from `site-preview` | להשאיר chrome ייחודי לאתר; להעביר image/button/dialog primitives משותפים לחבילה |
| ContentSnapshot → preview model | frontend `siteContent.ts` וגם `site-preview/buildSiteSectionPreviewData.ts` | `packages/site-preview` consuming `content-schema` | לאחד transformation; frontend יקבל model מוכן ולא יחזיק mapping מקביל |
| Responsive image rendering | frontend `components/OptimizedImage.tsx` + `utils/media.ts`; package `OptimizedImage.tsx` + `mediaHelpers.ts` | `packages/site-preview` | להסיר implementation ציבורי כפול ולהשתמש ב־export יחיד; לשמר במפורש את כלל CMS WebP-only עד pipeline חדש |
| Intro band renderer | frontend `components/sections/IntroBandSection.tsx`; package `IntroBandSectionContent.tsx` | `packages/site-preview` | הקובץ ב־frontend זהה byte-for-byte ואינו נצרך; להסיר בזמן refactor |
| Design CSS | `site-preview/styles/*`; frontend wrapper imports; admin `styles.css` | package styles for public/preview; admin tokens/primitives ייעודיים | wrappers של import אינם duplication; אין להעתיק selectors ל־admin |
| Contact/WhatsApp formatting | frontend `utils/contact.ts`; package `contactHelpers.ts` | contract/helper משותף ב־`site-preview` | לאחד builder אחד; UI יכול לספק labels אך encoding/business formatting לא יוכפל |
| Admin UI and editor state | admin `App.tsx` (1,016 lines) | admin feature modules | לפרק ל־shell, auth, admins, sections, services, media, publish; primitives משותפים נשמרים פעם אחת |
| Admin persistence | admin `googleApi.ts` | Pages Functions API + typed client | client לא מכיל business authorization; Google code מוסר אחרי cutover |
| Backend routing/domain logic | לא קיים | studio `functions/api` modules | route modules קטנים לפי auth/content/media/admins/publish; shared validation מ־`content-schema` |

Audit measurements captured for `ARC-001`: frontend `App.tsx` 140 lines; admin `App.tsx` 1,016; `site-preview/MainSections.tsx` 919; `buildSiteSectionPreviewData.ts` 249. Exact duplicate confirmed for `IntroBandSectionContent`; near-duplicate pairs confirmed for `OptimizedImage` and media helpers. No new package is justified: the existing `content-schema` and `site-preview` boundaries cover the shared contracts and rendering needs.

### Package boundary contract and target layout

Dependency direction is fixed and enforced by `pnpm architecture:boundaries`:

```text
apps/frontend ───────┐
                    ├──► packages/site-preview ───► packages/content-schema
apps/admin ─────────┘                 │
                                     └── React/lucide only

studio Pages Functions ─────────────────► packages/content-schema
packages/content-schema ─────────────────► zod only
```

No shared package may import an app. Cross-workspace imports use package public exports only; `/src` deep imports, relative imports that escape a workspace and dependency cycles fail validation.

Target layout, implemented incrementally by the task that owns each area:

```text
packages/content-schema/src/
  publicSite.ts                 # public v2 document and media contract
  cms.ts                        # future API/session/revision DTOs

packages/site-preview/src/
  primitives/                   # Button, Section, Heading, OptimizedImage, Dialog, fields
  sections/                     # Hero, Services, Gallery, Process, Trust, Contact
  model/                        # ContentSnapshot -> render model, no business fallback copy
  index.ts                      # deliberate public exports only

apps/frontend/nis-boutique-catering/src/
  App.tsx                       # composition root
  components/chrome/            # header, footer, floating actions
  hooks/                        # browser-only behavior
  data/                         # generated document adapter only

apps/admin/nis-content-studio/src/
  app/                          # shell and tab routing
  api/                          # one typed API client
  features/auth/
  features/admins/
  features/content/
  features/media/
  features/publish/
  components/                   # admin-only reusable primitives

apps/admin/nis-content-studio/functions/
  api/[[path]].ts               # thin entry/router
  _lib/auth/                    # Google verification and sessions
  _lib/content/                 # revision repository/domain service
  _lib/media/                   # R2 repository/domain service
  _lib/publish/                 # publish jobs and GitHub dispatch
```

Non-trivial React components live in dedicated files. Shared primitives contain no NIS copy and accept typed children/variants; domain copy comes only from `PublicSiteDocument`. Existing large files are temporary migration sources and must be split by `UI-002` and `ADM-001`, without changing the public package API until their consumers migrate.

## תוכנית משימות לפי שלבים

### Phase 0 — Governance, baseline and readiness

#### GOV-001 — Bootstrap the canonical tracker

- **Status:** `DONE`
- **Definition:** ליצור מסמך יחיד שמרכז scope, החלטות, משימות, תנאי קבלה, ראיות ו־change log.
- **Acceptance criteria:**
  - הקובץ נמצא תחת `docs/`.
  - הוא מצהיר במפורש שהוא source of truth.
  - הוא מגדיר read-before-change ו־update-after-change.
  - הוא מקושר מ־README.
- **Verification:** לפתוח את הקובץ ואת README ולוודא שהקישור תקין ושאין tracker נוסף שמתחרה בו.
- **Evidence:** `docs/public-site-redesign-tracker.md`; קישור canonical תחת `README.md` → `Documentation`.

#### GOV-002 — Capture the production and repository baseline

- **Status:** `DONE`
- **Dependencies:** `GOV-001`.
- **Definition:** לתעד לפני שינוי את מבנה ה־DOM החי, screenshots, headings, navigation, CTA behavior, console/network, bundle sizes, Lighthouse ו־current content version.
- **Acceptance criteria:**
  - תועדו desktop `1440px`, tablet `768px` ו־mobile `375px`.
  - נספרו sections מתוך production DOM ולא רק מתוך `sectionIds`.
  - נשמרו ערכי Lighthouse ו־bundle baseline.
  - תועדו כל שגיאות console/network קיימות כדי לא לייחס אותן לשינוי החדש.
- **Verification:** browser run מול `https://nisboutiquecatering.com/`, `curl -I`, build מקומי ו־Lighthouse; קישורי הראיות נרשמים במשימה.
- **Evidence (2026-07-20):**
  - Production DOM: ‏12 `main > section` elements; IDs present on `top`, ‏`gallery`, ‏`process`, ‏`faq`, ‏`contact`; content version `studio-2026-06-24-18-43-53`.
  - Screenshots: `output/playwright/baseline-2026-07-20/public-{1440,768,375}.png` and `studio-{1440,375}.png` (local ignored artifacts).
  - Browser: public 0 console errors / 1 preload warning; studio 0 errors / 0 warnings; mobile `scrollWidth === clientWidth === 375` on both surfaces.
  - Lighthouse mobile production: Performance 64, Accessibility 97, Best Practices 96, SEO 100; FCP 3.71s, LCP 9.32s, TBT 0ms, CLS 0, Speed Index 5.04s.
  - Local validation: `npx pnpm@9.15.9 validate` passed; public bundle JS 339.60KB + lazy 10.89KB, CSS 60.27KB; studio JS 299.61KB, CSS 7.92KB.
  - HTTP/security: public and studio returned 200 with HSTS, CSP, X-Frame-Options and X-Content-Type-Options; studio also returned noindex headers.
  - Known baseline warning: preloaded `salmon-skewers-lemon-720w.avif` was not consumed shortly after load.
  - Deployment verification: commit `3e02bf9`; CI run `29704351376` and Cloudflare deploy run `29704351375` succeeded.
  - Post-deploy production: public/studio HTTP 200; public remained at 12 sections and version `studio-2026-06-24-18-43-53`; both surfaces had 0 console errors and no mobile horizontal overflow.

#### GOV-003 — Add the admin rebuild and Cloudflare persistence plans

- **Status:** `DONE`
- **Dependencies:** user architecture input and repository audit.
- **Definition:** להוסיף תוכנית מלאה לבניית מסך האדמין מחדש ולמעבר מ־Sheets/Drive אל Pages Functions, D1 ו־R2, כולל data flow, migrations, security, rollback, tests ו־production verification.
- **Acceptance criteria:**
  - לשני הנושאים יש phases ומשימות אטומיות.
  - לכל משימה יש owner, dependencies, acceptance criteria ו־verification.
  - תועד impact על `content-schema`, studio, sync scripts, public site ו־Cloudflare workflow.
  - תועד מעבר בטוח מהמצב הקיים ללא אובדן תוכן או מדיה.
- **Verification:** Architecture review מתועד; כל open question הוכרע או מסומן blocker.
- **Evidence:** הסעיפים "מצב קיים, פער וארכיטקטורת יעד", ‏Phases 4–6, טבלת ההחלטות וה־risk register במסמך זה; בדיקת קוד של workflow, ‏`googleApi.ts`, ‏Apps Script, ‏build sync ויישום הייחוס.

#### GOV-004 — Run the final implementation readiness review

- **Status:** `DONE`
- **Dependencies:** `GOV-002`, `GOV-003`, `ARC-001`, `ARC-002`, `ARC-003`.
- **Definition:** לבצע review של כל התוכנית המאוחדת ולאשר סדר ביצוע שאינו יוצר כפילות או עבודה זמנית שתימחק בשלב האדמין/Drive.
- **Acceptance criteria:**
  - אין משימות סותרות או כפולות.
  - כל dependency פתוחה מתועדת.
  - הוגדר rollback לכל שינוי migration/deploy-sensitive.
  - שער המימוש עודכן מ־`BLOCKED` ל־`READY` בהחלטה מפורשת.
- **Verification:** review של המסמך מתחילתו ועד סופו ורישום החלטת readiness ב־Change Log.
- **Evidence (2026-07-20):** all 51 task definitions and dependency order were reviewed against the v2 contract, package ownership, migration map, rollback gates and production workflow. All 12 implementation decisions are now decided. `scripts/check-redesign-tracker.mjs` enforces 51 unique task IDs, one Definition/Acceptance/Verification/Evidence block per task, known task references, no open decision and a READY gate; it is part of root `validate`. Full `pnpm validate` passed. Commit `af1e9e8`; CI `29705118399` and deploy `29705118395` succeeded; public/studio returned HTTP 200 post-deploy. Implementation gate is explicitly `READY`; production cutover/retirement approvals remain scoped to their later tasks.

### Phase 1 — Architecture and contracts

#### ARC-001 — Map component ownership and duplication

- **Status:** `DONE`
- **Dependencies:** `GOV-002`.
- **Definition:** למפות את כל רכיבי האתר הקיים וה־preview, לזהות מה נשמר, מה מתמזג, מה נמחק ומה הופך ל־primitive משותף.
- **Acceptance criteria:**
  - לכל section ורכיב יש owner package וקובץ יעד.
  - אין שני implementations לאותו pattern.
  - נבדקו `apps/frontend`, `packages/site-preview` והסטודיו העתידי לפני יצירת abstractions.
  - כל abstraction חדשה מוצדקת על ידי יותר מצרכן אחד או business contract ברור.
- **Verification:** duplication table + `rg` על שמות/markup/styles חוזרים + review של dependency graph.
- **Evidence (2026-07-20):** component ownership table above; `rg` consumer/export audit; file-size audit; `shasum`/`diff` confirmed exact duplicate IntroBand renderer and near-duplicate image/media helpers. Target ownership assigned for every current section, preview, chrome, editor and backend capability; no additional shared package approved. Local `pnpm validate` passed; commit `6e2ba21`; CI `29704553125` and deploy `29704553137` succeeded; public/studio returned HTTP 200 post-deploy.

#### ARC-002 — Define the six-section content contract

- **Status:** `DONE`
- **Dependencies:** `ARC-001`, Cloudflare architecture from `GOV-003`.
- **Definition:** להגדיר schema טיפוסי יחיד עבור Hero, Services, Gallery, Process, Trust ו־Contact.
- **Acceptance criteria:**
  - schema נמצא ב־`packages/content-schema`.
  - כל השדות הדרושים ניתנים לעריכה מהמערכת המתוכננת.
  - אין שדות כפולים בין `settings`, `sections`, `services`, `gallery` ו־`media`.
  - defaults, validation errors ו־migration behavior מוגדרים.
- **Verification:** type-check, schema unit tests, valid/invalid fixtures וצריכה משותפת על ידי studio/sync/frontend.
- **Evidence (2026-07-20):** `packages/content-schema/src/publicSite.ts` exports strict `publicSiteDocumentSchema` version 2 and inferred readonly-compatible types; the document contains exactly Hero, Services, Gallery, Process, Trust and Contact plus one media registry and settings object. Counts, IDs, order uniqueness, R2 object metadata and active image/video references are validated. The legacy schema remains exported only for staged migration and cannot be parsed as v2. `publicSite.test.ts` covers valid, extra legacy section, count, media-reference and duplicate-order fixtures. Package type-check/lint and 14 tests passed; full workspace `pnpm validate` passed. Commit `60b14e8`; CI `29704706825` and deploy `29704706847` succeeded; public/studio returned HTTP 200 post-deploy.

#### ARC-003 — Define component and package boundaries

- **Status:** `DONE`
- **Dependencies:** `ARC-001`, `ARC-002`.
- **Definition:** לקבוע מבנה קבצים ו־public APIs כך שכל section מורכב מ־primitives משותפים בלי להפוך package אחד למונולית.
- **Acceptance criteria:**
  - כל קומפוננטה לא טריוויאלית בקובץ ייעודי.
  - shared primitives קטנים, typed ונטולי business copy.
  - אין import מתוך `src` פרטי של package אחר.
  - אין circular dependency או deep dependency chain.
- **Verification:** build workspace, dependency inspection, lint boundaries ו־code review checklist.
- **Evidence (2026-07-20):** target package/file layout and dependency diagram documented above. `scripts/check-architecture-boundaries.mjs` scans all workspace source imports, forbids undeclared workspace dependencies, app imports from shared packages, `/src` deep imports, relative workspace escapes and dependency cycles. `pnpm architecture:boundaries` is part of root `validate`; full validation passed. Commit `74e7f35`; CI `29704843089` and deploy `29704843111` succeeded; public/studio returned HTTP 200 post-deploy.

#### ARC-004 — Plan legacy-content migration and rollback

- **Status:** `DONE`
- **Dependencies:** `ARC-002`, `GOV-003`.
- **Definition:** למפות כל section ושדה ישן ליעד חדש, כולל rows שיש לארכב ו־defaults שיש להסיר כדי למנוע חזרה אוטומטית.
- **Acceptance criteria:**
  - קיימת migration table מלאה old → new/archive.
  - נשמר backup לפני mutation של מקור ה־Sheets/Drive הקיים או D1/R2 לאחר cutover.
  - rollback נבדק על snapshot נפרד.
  - אין content loss ואין duplicate active rows.
- **Verification:** dry run, schema validation והשוואת counts/IDs לפני ואחרי.
- **Evidence (2026-07-20):** the complete legacy collection/group/field mapping and rollback rules are documented above. `scripts/audit-legacy-migration-plan.mjs` covered all 14 fallback groups and all 13 generated groups, detected 0 duplicate IDs and 0 missing media references, simulated archive without removing rows, restored a separate in-memory snapshot byte-for-byte and proved both source files unchanged. Fallback counts: 41 sections, 3 services, 15 gallery, 15 media, SHA-256 `bbc1f16e…`; generated counts: 40/3/15/15, SHA-256 `1d824d5b…`. The committed snapshots are the pre-mutation local backup; `MIG-001` remains the mandatory immutable remote Sheets/Drive backup gate before any external write. `pnpm migration:plan:audit`, `content:check` and full `pnpm validate` passed. Commit `eb9c3f5`; CI `29705005543` and deploy `29705005549` succeeded; public/studio returned HTTP 200 post-deploy.

### Phase 2 — Shared design system and primitives

#### UI-001 — Consolidate design tokens and Hebrew typography

- **Status:** `DONE`
- **Dependencies:** `ARC-003`.
- **Definition:** לאחד colors, spacing, type scale, radius, shadows, z-index, motion ו־breakpoints למקור יחיד.
- **Acceptance criteria:**
  - אין raw values חוזרים בקומפוננטות כאשר token מתאים קיים.
  - typography עברית עובדת ללא fallback מקרי.
  - כל color pair עומד ב־WCAG AA.
  - font loading אינו חוסם rendering ואינו גורם CLS משמעותי.
- **Verification:** style audit, contrast check, screenshots בעברית ו־Lighthouse.
- **Evidence (2026-07-20):** `packages/site-preview/src/styles/tokens.css` is the single public/preview token source for typography, brand/semantic colors, spacing, layout, radii, shadows, z-index, motion and documented breakpoints; both public and studio preview consume it through the package base stylesheet. All legacy `Playfair Display` declarations were replaced by `--font-display`; `Noto Serif Hebrew` 600/700/800 and Assistant 400–800 load with preconnect and `display=swap`, with explicit Hebrew/system fallbacks. `scripts/check-design-tokens.mjs` enforces eight token groups, font loading rules and eight WCAG AA text pairs and runs in root `validate`. Local Playwright at 1440/375 confirmed computed families, 0 console errors and no horizontal overflow; screenshots are ignored local artifacts. Production mobile Lighthouse: Performance 65, Accessibility 100, Best Practices 96, SEO 100, contrast pass, LCP 9.2s, TBT 0ms and CLS 0. The WhatsApp surface changed to semantic `#0d6b60`, improving ivory contrast from 3.98:1 to 6.16:1. Commit `d74897e`; CI `29705344793` and deploy `29705344824` succeeded; public/studio HTTP 200 and production browser re-confirmed loaded Noto, 0 errors and no overflow.

#### UI-002 — Build or refine reusable primitives

- **Status:** `DONE`
- **Dependencies:** `UI-001`, `ARC-003`.
- **Definition:** ליצור או לשפר רק את ה־primitives שנדרשים בפועל: `Section`, `SectionHeading`, `Button`, `MediaCard`, `ServiceCard`, `IconTextItem`, `Accordion`, `FormField`, `OptimizedImage` ו־`Dialog/Lightbox`.
- **Acceptance criteria:**
  - אין markup או CSS כפול בין sections.
  - APIs קטנים, typed ו־readonly.
  - variants משתמשים ב־union מפורש ולא boolean soup.
  - קיימות בדיקות לרכיבים אינטראקטיביים ולמצבי edge.
- **Verification:** component tests, keyboard tests, visual states ו־duplication review.
- **Evidence (2026-07-20):** `packages/site-preview/src/primitives/` now owns typed `Section`, `SectionHeading`, discriminated `Button`, `MediaCard`, `ServiceCard`, `IconTextItem`, `Accordion`, `FormField`, `OptimizedImage` and focus-trapping `Dialog`. The package public API exports them deliberately; compatibility re-exports avoid breaking consumers. The duplicate frontend `OptimizedImage` and app-specific lightbox focus hook were removed; `SiteChrome` consumes the shared image/dialog, both section entrypoints consume the shared Button/Heading, and duplicate MainSections helpers were deleted. All primitive props are readonly, variants explicit unions and remaining package/app TypeScript contains no `any`. The package participates in lint/test/type-check and both app builds; 8/8 package tests and 9/9 frontend tests passed, including keyboard/focus/lightbox. Full workspace validation passed. Commit `5c1b6c4`; CI `29705702981` and deploy `29705702982` succeeded; public/studio HTTP 200. Production 375px smoke had 6 gallery triggers, no overflow/errors; shared dialog focused its close surface, locked body, closed on Escape and cleared the lock. Only the known image-preload warning remained.

#### UI-003 — Simplify global navigation and conversion surfaces

- **Status:** `DONE`
- **Dependencies:** `UI-002`.
- **Definition:** לבנות header, mobile navigation, WhatsApp CTA ו־footer לפי ארבעת יעדי הניווט החדשים.
- **Acceptance criteria:**
  - אין יותר מארבעה קישורי section ראשיים.
  - active state ו־anchor navigation נכונים.
  - mobile menu נגיש ונסגר אחרי בחירה/Escape.
  - CTA קבוע אינו מכסה תוכן או safe area.
- **Verification:** keyboard, screen reader smoke test, mobile/desktop browser tests ו־direct anchor URLs.
- **Evidence (2026-07-20):** `Topbar` now renders exactly four primary anchors (`#experiences`, `#gallery`, `#process`, `#contact`) with scroll-derived active state; FAQ remains content inside the conversion path, not a primary destination. The responsive menu is controlled by one button with `aria-expanded`/`aria-controls`, labelled navigation, 48px menu targets, close-on-selection, Escape close and focus return. Desktop hides the toggle and shows all four links; 375px shows logo, compact WhatsApp CTA and menu. Mobile sticky conversion uses `env(safe-area-inset-bottom)`. Two focused component tests bring frontend to 11/11 and cover link count, active state, selection close, Escape and focus. Local Playwright at 375/1440 confirmed direct `#gallery`, 4 links, menu grid/open/close, desktop/mobile visibility, 0 overflow and 0 console errors; ignored screenshots: `output/playwright/ui-003-{menu-375,nav-1440}.png`. Commit `d7198fa`; CI `29705909705` and deploy `29705909716` succeeded. Production at 375px re-confirmed the four exact anchors, direct `#gallery`, open menu display, Escape close with focus return, 0 overflow and 0 console errors; public and studio returned HTTP 200.

#### UI-004 — Normalize motion and interaction states

- **Status:** `DONE`
- **Dependencies:** `UI-001`, `UI-002`.
- **Definition:** להסיר motion דקורטיבי מיותר, לאחד durations/easing ולכסות hover/focus/pressed/loading/error/success/reduced-motion.
- **Acceptance criteria:**
  - אין animation מתמשכת ב־CTA הראשי.
  - אין אנימציות layout שמייצרות reflow.
  - reduced-motion מציג את כל התוכן מיד.
  - כל interactive state ברור ללא שינוי layout bounds.
- **Verification:** DevTools reduced motion, keyboard walkthrough ו־performance trace.
- **Evidence (2026-07-20):** all continuous decorative animations were removed, including primary/contact CTA breathing, floating hero notes, proof sweeps and moving rails. Every remaining entrance/interaction transition uses the shared 180/240/280ms motion tokens; the topbar no longer transitions padding, the experience meter uses a compositor transform instead of inset and text-link hover no longer changes gap. Shared controls now expose stable pressed, focus-visible, disabled, `aria-busy`, success and error states without changing layout dimensions. `scripts/check-motion-system.mjs` runs in root `validate` and rejects infinite animation, layout-property transitions, non-token transition durations, missing interaction selectors or an incomplete reduced-motion override. Site-preview has 9/9 tests including forwarded loading/disabled/outcome states; full workspace validation passed. Local Playwright at 375px found 0 infinite animations, 0 overflow and 0 console errors; the visible primary CTA kept its 347×50 layout size through hover and reported `animation-name: none`. Emulated `prefers-reduced-motion: reduce` found 7 reveal nodes immediately visible (one identity transform from the hero layout), 0 animations over 20ms and 0 overflow. A keyboard/hover performance trace completed without console errors; local trace is an ignored artifact. Commit `c6221bf`; CI `29706365006` and deploy `29706364983` succeeded. Production at 375px confirmed 0 infinite animations, primary CTA `animation-name: none` at 347×50, 0 overflow/errors and HTTP 200 on public/studio. Production reduced-motion confirmed all 40 reveal nodes visible, 0 active animations over 20ms and 0 overflow.

### Phase 3 — Implement the public six-section experience

#### WEB-001 — Implement Hero

- **Status:** `DONE`
- **Dependencies:** `ARC-002`, `UI-002`, `UI-003`.
- **Definition:** להחליף את Hero + Intro Band + Manifesto + Audience בפתיחה מאוחדת אחת.
- **Acceptance criteria:**
  - מוצגים title, description, primary CTA, secondary CTA ושלוש נקודות ערך בלבד.
  - CTA מייצר WhatsApp URL נכון.
  - תמונה מרכזית responsive ללא CLS.
  - ה־sections הישנים אינם rendered ואינם חוזרים מה־content defaults.
- **Verification:** unit test ל־CTA, DOM assertion, screenshots בכל breakpoint ו־production content check.
- **Evidence (2026-07-20):** the public and studio preview now consume one `HeroSection` from `packages/site-preview/src/PrimarySections.tsx`; the duplicate Hero implementation in `MainSections.tsx` was removed. `publicHeroDefaults` in the shared content contract is the single approved fallback for title, description, CTA copy/message and exactly three value points, preventing legacy Sheets hero/hero-badges defaults from restoring the old public composition before v2 migration. The Hero renders one eager responsive image with explicit source dimensions and source-independent accurate alt text, one title, one description, primary WhatsApp CTA, direct `#gallery` CTA and exactly three value points. Video, background collage, stats, notes, Intro Band, Manifesto and Audience are no longer rendered; the legacy component exports were removed. Content-schema has 15/15 tests, site-preview 9/9 and frontend 11/11; full workspace validation and both app builds passed. Local Playwright at 375/768/1024/1440 confirmed the exact approved copy and values, correct CTA URL, image-first mobile order, content-right/image-left desktop order, 0 overflow/errors and no legacy sections/video. The reserved media dimensions produced measured CLS 0 at 375px; ignored screenshots: `output/playwright/web-001-hero-{375,768,1024,1440}.png`. The first production pass exposed that remote content sync selected `vegetable-focaccia.webp` (2000×1500) rather than the committed local fallback; the image alt was corrected from a dish-specific salmon label to the accurate generic label before task closure. Implementation commit `916e806` passed CI `29706759177` and deploy `29706759207`; corrective commit `8b45c5e` passed CI `29706860904` and deploy `29706860944`. Cache-busted production verification confirmed the final alt, exact copy/three values, correct WhatsApp/gallery URLs, image-first mobile and content-right desktop layouts, 0 legacy nodes/video/overflow/errors, measured CLS 0 and HTTP 200 on public/studio.

#### WEB-002 — Implement Services

- **Status:** `DONE`
- **Dependencies:** `ARC-002`, `UI-002`.
- **Definition:** להציג שלושה שירותים ברורים מתוך מקור התוכן המשותף.
- **Acceptance criteria:**
  - שלוש קטגוריות פעילות מוצגות בסדר מוגדר.
  - כל כרטיס כולל media, title, short copy, fit ו־CTA.
  - השירותים אינם משוכפלים ב־section נוסף.
  - empty/disabled service state מוגדר.
- **Verification:** schema/service fixtures, DOM count, WhatsApp context tests ו־mobile browser test.
- **Evidence:** `publicServicesDefaults` הוא מקור שמות/סדר/CTA יחיד; `ServicesSection` המשותף מציג בדיוק שלושה כרטיסים ומצב חסר מפורש, וקומפוננטות השירותים הישנות הוסרו. 16/16 בדיקות schema, ‏11/11 בדיקות `site-preview`, ‏11/11 בדיקות frontend ו־`pnpm validate` עברו. Playwright לוקאלי וב־production ב־375/1440 אישר את שלושת השמות בסדר הנכון, media/copy/fit/CTA בכל כרטיס, URL וואטסאפ תלוי־שירות, טור מובייל/שורת desktop, ‏0 tablist כפול ו־0 overflow/console errors. צילומי מסך לוקאליים: `output/playwright/web-002-services-375.png`, ‏`output/playwright/web-002-services-1440.png`. commit `54eff13`; CI `29707226525`; deploy `29707226533`; public/studio החזירו HTTP 200.

#### WEB-003 — Implement Gallery with integrated video

- **Status:** `DONE`
- **Dependencies:** `ARC-002`, `UI-002`, `CF-007`.
- **Definition:** לאחד gallery ו־real media למשטח מדיה אחד, מהיר ונגיש.
- **Acceptance criteria:**
  - מוצגות 6–9 תמונות ראשוניות ווידאו אחד.
  - filters נגזרים מה־schema ואינם hardcoded בכמה מקומות.
  - lightbox נגיש ל־keyboard ומחזיר focus.
  - image variants, lazy loading ו־dimensions עובדים לכל media item.
- **Verification:** media check, keyboard/lightbox tests, network inspection, CLS measurement ו־broken asset scan.
- **Evidence:** `GallerySection` משותף יחיד מאחד את הסרטון ואת התמונות, גוזר את המסננים מתוך קטגוריות המדיה הזמינות ומציג 6 תמונות ראשוניות. מקור labels כפול הוסר משכבות ה־preview וה־frontend. לכל תמונה `srcset`, מידות ו־lazy loading; הסרטון משתמש ב־poster וב־`preload="metadata"`. ‏20/20 בדיקות `site-preview`, ‏14/14 בדיקות frontend ו־full `pnpm validate` עברו. בדפדפן Chrome מקומי אומתו 6 תמונות, סרטון יחיד, כל המסננים, lightbox עם Escape והחזרת focus, פריסה רספונסיבית ללא overflow, ‏0 console errors, ‏0 broken assets, media ב־200/206 ו־CLS ‏0.0058. Commit `d64fc32`, ‏CI `29733285325` ו־deploy `29733285346` עברו. Production בדפדפן נקי אישר 6 תמונות, סרטון אחד, 6 מסננים נגזרים, ‏0 section ישן/overflow, image variants/dimensions/lazy loading, keyboard Escape והחזרת focus; כל script/image/media חזרו `200/206` ושני ה־roots וה־health החזירו `200`.

#### WEB-004 — Implement Process

- **Status:** `DONE`
- **Dependencies:** `ARC-002`, `UI-002`.
- **Definition:** למזג את process וה־coordination לארבעה שלבים ומידע תפעולי קצר.
- **Acceptance criteria:**
  - ארבעה שלבים בלבד ובסדר לוגי.
  - כל מידע תפעולי מגיע ממקור תוכן מוגדר.
  - desktop horizontal ו־mobile vertical ללא כפילות markup.
  - אין טענות תפעוליות שלא אושרו.
- **Verification:** content fixture, responsive DOM/CSS test ו־manual content review.
- **Evidence:** `publicProcessDefaults` הוא מקור יחיד לארבעת השלבים ולשלוש ההערות התפעוליות המאושרות; `ProcessSection` יחיד החליף את process ו־coordination הנפרדים ומציג empty state אם המקור חלקי. 17/17 בדיקות schema, ‏13/13 בדיקות `site-preview`, ‏11/11 בדיקות frontend ו־`pnpm validate` עברו. Playwright לוקאלי וב־production ב־375/1440 אישר ארבעה שלבים בסדר המאושר, 3 הערות, section יחיד, timeline אנכי/שורה אופקית, ‏0 copy ישן/overflow/errors. צילומי מסך לוקאליים: `output/playwright/web-004-process-375.png`, ‏`output/playwright/web-004-process-1440.png`. commit `e49d915`; CI `29707490546`; deploy `29707490510`; public/studio החזירו HTTP 200.

#### WEB-005 — Implement Trust without owner portrait

- **Status:** `DONE`
- **Dependencies:** `ARC-002`, `UI-002`.
- **Definition:** להחליף את story הארוך באזור אמון ממוקד תוצרים ושירות.
- **Acceptance criteria:**
  - אין תמונה מרכזית של יהודית.
  - מוצגות שלוש נקודות אמון מאושרות בלבד.
  - המלצות מוצגות רק אם יש להן מקור מאומת.
  - אין section ביוגרפי נוסף או copy שחוזר מה־Hero.
- **Verification:** DOM/text search, content-source review ו־visual review.
- **Evidence:** `publicTrustDefaults` הוא מקור יחיד לשלוש נקודות האמון המאושרות ורשימת ההמלצות בו ריקה; `TrustSection` יחיד החליף את ה־story הביוגרפי ואת trust הישן ומשתמש בתמונת אוכל עם alt משמעותי. 18/18 בדיקות schema, ‏15/15 בדיקות `site-preview`, ‏11/11 בדיקות frontend ו־`pnpm validate` עברו. Playwright לוקאלי וב־production ב־375/1440 אישר 3 נקודות, תמונת אוכל אחת, ‏0 אזכורי יהודית/סיפור מותג/blockquote, פריסה responsive ו־0 overflow/errors. צילומי מסך לוקאליים: `output/playwright/web-005-trust-375.png`, ‏`output/playwright/web-005-trust-1440.png`. commit `88d939d`; CI `29707679675`; deploy `29707679717`; public/studio החזירו HTTP 200. לאחר חלון propagation קצר asset ה־JS אומת שוב כ־`application/javascript` והבדיקה עברה בדפדפן נקי.

#### WEB-006 — Implement FAQ and contact conversion section

- **Status:** `DONE`
- **Dependencies:** `ARC-002`, `UI-002`.
- **Definition:** לאחד FAQ וטופס פנייה למסך סיום אחד עם progressive disclosure.
- **Acceptance criteria:**
  - מוצגות 3–4 שאלות מאושרות.
  - שדות חובה מצומצמים וברורים; שדות משניים אופציונליים.
  - errors מוצגים ליד השדה ו־focus עובר לשגיאה הראשונה.
  - submit יוצר הודעת WhatsApp תקינה ומקודדת.
- **Verification:** form unit tests, invalid/valid flows, mobile keyboard test, WhatsApp URL assertion ו־screen reader smoke test.
- **Evidence:** `publicContactDefaults` מרכז 4 שאלות ו־CTA; `ContactSection` יחיד החליף FAQ וטופס נפרדים ומשתמש ב־Accordion/FormField/Button המשותפים. הטופס כולל 3 שדות חובה ו־3 אופציונליים בלבד, validation inline עם `aria-invalid`/`aria-describedby` ו־focus לשגיאה הראשונה. 19/19 בדיקות schema, ‏18/18 בדיקות `site-preview`, ‏11/11 בדיקות frontend ו־`pnpm validate` עברו, כולל invalid/valid flows ו־WhatsApp URL מקודד. Playwright לוקאלי וב־production ב־375/1440 אישר 4 FAQ, ‏6 fields, mobile input modes, טור/שתי עמודות, ‏0 section כפול/overflow/errors ו־screen-reader smoke. צילומי מסך לוקאליים: `output/playwright/web-006-contact-errors-375.png`, ‏`output/playwright/web-006-contact-1440.png`. commit `edba315`; CI `29707932127`; deploy `29707932147`; public/studio החזירו HTTP 200.

### Phase 4 — Cloudflare backend foundation

#### CF-001 — Provision preview and production D1/R2 resources

- **Status:** `DONE`
- **Dependencies:** `GOV-004`.
- **Definition:** ליצור D1 ו־R2 נפרדים ל־preview/production ולתעד bindings ב־Wrangler config של הסטודיו.
- **Acceptance criteria:** bindings מסוג `DB` ו־`MEDIA` קיימים בכל environment; IDs אינם hardcoded בקוד; bucket פרטי כברירת מחדל; local dev משתמש במשאבים מקומיים.
- **Verification:** `wrangler pages dev`, binding smoke test, Cloudflare dashboard/API inventory והשוואת preview מול production.
- **Evidence:** נוצרו D1 נפרדים באזור EEUR: `nis-content-preview` (`80b4a9b2-4f3b-42a7-af3f-1e4d629c0c7d`) ו־`nis-content-production` (`fd74127a-fea6-4517-8c54-f467a8fc6437`). לאחר השלמת checkout נוצרו buckets פרטיים `nis-media-preview` ו־`nis-media-production`; inventory אומת ב־Wrangler. `wrangler.toml` מגדיר `DB`/`MEDIA` מקומיים על משאבי preview, וחוזר על כל ה־bindings הלא־מורשים בירושה תחת `env.preview` ו־`env.production` עם משאבים נפרדים. `wrangler types` יצר `worker-configuration.d.ts`; `/api/health` בודק D1/R2 בלי לחשוף IDs או secrets. `wrangler pages dev` הציג את שני ה־bindings במצב local והחזיר `200` עם `database/media: ready`; deployment preview `c1094efc` החזיר אותה תוצאה. `pnpm validate` עבר; commit `75ae97c` עבר CI `29719259191` ו־deploy `29719259237`. Production `/api/health` החזיר `200` עם שני המשאבים `ready`, האתר והסטודיו החזירו `200`, ו־`pages download config` לאחר הפריסה אישר ש־Preview מחובר ל־preview D1/R2 ו־Production ל־production D1/R2.

#### CF-002 — Add versioned D1 migrations and seed strategy

- **Status:** `DONE`
- **Dependencies:** `CF-001`, `ARC-002`.
- **Definition:** להוסיף migrations ל־`admins`, ‏`admin_sessions`, ‏`content_revisions`, ‏`media_assets` ו־`publish_jobs`, בלי runtime `CREATE TABLE`.
- **Acceptance criteria:** migrations idempotent לפי מנגנון Wrangler; indexes על email/session/status; foreign keys ו־constraints קריטיים; bootstrap admin מגיע מ־seed מאובטח ולא מ־UI ציבורי.
- **Verification:** apply על DB מקומי ריק, apply חוזר ללא drift, schema inspection, migration rollback rehearsal על backup.
- **Evidence:** נוסף migration versioned בשם `0001_initial_content_platform.sql` ל־`admins`, ‏`admin_sessions`, ‏`content_revisions`, ‏`media_assets` ו־`publish_jobs`, עם STRICT tables, ‏foreign keys, status/check constraints, optimistic revision version, JSON validation, unique published revision ואינדקסים ל־email/session/status. `wrangler.toml` מגדיר `migrations_dir`/`d1_migrations` בכל environment ואין runtime schema creation. כלי `seed-bootstrap-admin.mjs` מקבל email/name רק מ־environment, דורש confirmation מפורש ל־production ומבצע upsert server-side; אין bootstrap UI. migration הוחל על DB מקומי ריק, apply חוזר החזיר `No migrations to apply`, ‏schema/foreign-key inspection עבר, ו־backup/restore rehearsal החזיר את מצב pre-migration בלי טבלאות היעד. seed מקומי כפול השאיר admin פעיל יחיד. Preview remote הוחל ונזרע, עם migration אחד, admin פעיל אחד ו־0 foreign-key violations. `pnpm validate` עבר; commit `58a611a` עבר CI `29719632920` ו־deploy `29719632890`. לפני Production נשמר Time Travel bookmark `00000002-00000000-000050ae-d8bd4822629525ba61881ef35e4c36ab`; migration וה־seed הוחלו, apply חוזר היה no-op, ונמצאו 5 domain tables, ‏migration אחד, admin פעיל אחד ו־0 foreign-key violations. Production health וה־public/studio roots החזירו `200`.

#### CF-003 — Build the typed Pages Functions API foundation

- **Status:** `DONE`
- **Dependencies:** `CF-001`, `ARC-003`.
- **Definition:** להוסיף router קטן ל־`/api/*`, error envelope, request IDs, typed env ו־shared validation בלי קובץ handler מונוליתי.
- **Acceptance criteria:** route modules לפי domain; `unknown` payloads עוברים Zod; same-origin admin responses ללא wildcard CORS; health endpoint אינו חושף secrets.
- **Verification:** unit tests ל־router/errors, Miniflare/Wrangler integration tests, type-check ו־404/405/invalid-body tests.
- **Evidence:** נוסף entry יחיד `functions/api/[[path]].ts` שמאציל ל־router ול־domain route modules. שכבת `_lib/http` מרכזת typed route contracts, ‏crypto request IDs, security headers, ‏404/405/500 error envelope ו־Zod body parsing מ־`unknown`; אין wildcard CORS ואין `Env` ידני. health הועבר ל־`_lib/routes/health.ts` ואינו חושף IDs/secrets. ‏21/21 בדיקות הסטודיו עברו, כולל router/error/404/405/unexpected error ו־valid/invalid/malformed/content-type validation; type-check ולינט עברו. `wrangler pages dev` integration החזיר health `200`, missing `404`, method `405` עם `Allow: GET`, request IDs/security headers וללא `Access-Control-Allow-Origin`; full `pnpm validate` עבר. Preview deployment `c4b57d3e` החזיר אותם contracts מול D1/R2 האמיתיים. Commit `fb936b6` עבר CI `29720183240` ו־deploy `29720183269`; Production אישר health `200` עם D1/R2 ready, ‏missing `404`, ‏method `405`, ‏Allow/request IDs/security headers וללא wildcard CORS, ושני ה־roots החזירו `200`.

#### CF-004 — Implement Google identity verification and server sessions

- **Status:** `DONE`
- **Dependencies:** `CF-002`, `CF-003`.
- **Definition:** לאמת Google ID token בשרת וליצור session cookie אקראי שה־hash שלו נשמר ב־D1.
- **Acceptance criteria:** נבדקים signature/issuer/audience/expiry/email_verified; רק admin פעיל נכנס; cookie הוא HttpOnly/Secure/SameSite; logout, expiry והשבתת admin מבטלים גישה.
- **Verification:** tests ל־token תקין/מזויף/פג/קהל שגוי, cookie attributes, revocation ושימוש חוזר ב־session מבוטל.
- **Evidence:** נוספו domain modules נפרדים לאימות Google ול־session, ו־routes ל־`POST /api/auth/google`, ‏`GET /api/auth/session` ו־`POST /api/auth/logout`. אימות ה־ID token משתמש ב־Google JWKS וב־RS256 ובודק issuer, audience, expiry, subject, email ו־`email_verified`; שגיאות אינן חושפות פרטי token. רק רשומת admin פעילה יכולה לקשור subject וליצור session. token אקראי של 256-bit מוחזר רק ב־cookie ‏`__Host-` עם `HttpOnly`, ‏`Secure`, ‏`SameSite=Strict`, ‏`Path=/` ו־8 שעות; ב־D1 נשמר SHA-256 בלבד. lookup בודק hash, expiry, revocation ו־admin פעיל; logout מבטל ב־D1 ומוחק cookie. ‏29/29 בדיקות סטודיו עברו, כולל JWT חתום/מזויף/פג/קהל שגוי/email לא מאומת, cookie flags, hash-only storage, admin מושבת, expiry, revoke ושימוש חוזר. Wrangler local אישר `401` ללא session/לטוקן מזויף ו־logout `200` עם cookie מחיקה ו־security headers. `GOOGLE_CLIENT_ID` הציבורי מוגדר במפורש ובאופן זהה ל־local/preview/production ב־Wrangler; Preview deployment `7b61f2ba` אישר token מזויף `401`, session חסר `401`, logout `200`, cookie מחיקה ו־0 sessions שנוצרו. Commit `09d5e62` עבר CI `29720818114` ו־deploy `29720818107` (deployment `e0fd5f3b`). Production אישר token מזויף `401`, session חסר `401`, logout `200` עם cookie מחיקה מוקשח, request IDs/security headers, ‏0 sessions ב־D1 ו־health/public/studio `200`.

#### CF-005 — Centralize authorization, CSRF and abuse controls

- **Status:** `DONE`
- **Dependencies:** `CF-004`.
- **Definition:** ליצור middleware יחיד לכל route ניהולי עם session lookup, origin/CSRF checks, limits ו־security response headers.
- **Acceptance criteria:** אין authorization ב־React; כל mutation חסום ללא session ו־origin תקין; body/upload size מוגבלים; rate limit בסיסי ל־login/upload/publish.
- **Verification:** negative integration matrix ל־401/403/413/415/429, header audit וחיפוש שמוכיח שאין email bearer או wildcard admin CORS.
- **Evidence:** router יחיד מפעיל `enforceAdminApiPolicy` לפני כל handler לפי policy typed של ה־route. השכבה מרכזת session lookup מול D1, Origin/CSRF same-origin, allowlist ל־content types, בדיקת `Content-Length` וגם streaming body limit, ו־rate limits ל־login/upload/publish. migration versioned ‏`0002_api_rate_limits.sql` שומר fixed-window counters לפי SHA-256 של scope+client identifier, בלי IP גלוי; תגובת `429` כוללת `Retry-After`. auth routes משתמשים באותם presets ואין authorization ב־React. ‏35/35 בדיקות סטודיו עברו, כולל matrix מלא של `401/403/413/415/429`; full `pnpm validate` עבר וחיפוש production code שלל email bearer, wildcard admin CORS ו־`VITE_ALLOWED_EDITORS`. local migration הוחל וחזרה שנייה הייתה no-op; Wrangler local אישר את כל הסטטוסים וה־headers. Preview D1 הוחל ונבדק עם שתי migrations והטבלה החדשה. Preview deployment `03751190` אישר שוב `401/403/413/415/429`, ‏`Retry-After`, request IDs/security headers וללא wildcard CORS; counter נשמר כמפתח hash באורך 64. Commit `3173e7b` עבר CI `29721372197` ו־deploy `29721372190` (Production deployment `c8332f56`). לפני migration Production נשמר bookmark `00000005-00000000-000050ae-f775ab4d77178760cc2f25e4f9e23027`; apply עבר, apply חוזר היה no-op, נמצאו שתי migrations ו־0 foreign-key violations. Production אישר `401/403/413/415`, counter hash יחיד לאחר login שגוי, request IDs/security headers, health ושני roots `200`; ‏`429` אומת ב־unit/local/Preview בלי לנעול בכוונה את כתובת המנהל ב־Production.

#### CF-006 — Implement draft and revision APIs

- **Status:** `DONE`
- **Dependencies:** `CF-002`, `CF-003`, `CF-005`.
- **Definition:** לממש read/save של `ContentSnapshot` כ־revision אטומי עם optimistic concurrency.
- **Acceptance criteria:** כל read/write עובר schema; conflict מחזיר `409`; draft אינו משנה published; נשמר created-by/audit; אין partial content update שמייצר snapshot לא תקין.
- **Verification:** repository tests, concurrent-save test, invalid schema test ו־save→reload parity מלא.
- **Evidence:** נוספו repository ו־routes נפרדים ל־`GET/PUT /api/content/draft`, המבוססים רק על `publicSiteDocumentSchema` v2 ועל ה־principal שה־security middleware אימת. כל read עושה JSON+schema validation מחדש וכל write שומר snapshot שלם בפקודת D1 אטומית; יצירה עם `expectedVersion: null` מותרת רק כשאין draft, ועדכון מגדיל `version` רק כשהגרסה הצפויה תואמת, אחרת `409`. migration ‏`0003_draft_revision_audit.sql` מוסיף `updated_by`, backfill, אינדקס audit ו־unique draft; published rows אינם משתנים במסלול save. ‏40/40 בדיקות סטודיו עברו, כולל repository save→reload parity, concurrent stale save, invalid/corrupt schema, audit ו־published immutability; full `pnpm validate` עבר. local migration וחזרה no-op עברו; Wrangler local אישר authenticated read, ‏`401/403/400` ו־headers. Preview D1 מכיל שלוש migrations ו־0 FK violations. Preview deployment `94a0b917` שמר snapshot v2 אמיתי, טען אותו byte-equivalent דרך ה־API, עדכן version ‏1→2, החזיר `409` לשמירה stale ו־`400` למסמך חסר; audit IDs נשמרו ונתוני הבדיקה נמחקו במדויק. Commit `3064caf` עבר CI `29722058410` ו־deploy `29722058384` (Production deployment `e283b557`). לפני migration Production נשמר bookmark `00000007-00000000-000050ae-2add70c7ecf88430169746d6327a8c50`; apply וחזרה no-op עברו, עם שלוש migrations ו־0 FK violations. Production אישר `401` לקריאה/כתיבה לא מאומתת, `403` ל־Origin חסר, request IDs/security headers, ‏0 content rows ו־health/public/studio `200`, בלי ליצור טיוטת production לפני migration התוכן.

#### CF-007 — Implement R2 media lifecycle APIs

- **Status:** `DONE`
- **Dependencies:** `CF-001`, `CF-005`, `ARC-002`.
- **Definition:** לממש upload/list/update-metadata/soft-delete/restore למדיה, עם streaming ל־R2 ומטא־דאטה ב־D1.
- **Acceptance criteria:** allowlist של MIME וגודל; object keys server-generated; hash מונע כפילות מקרית; אין Base64; מחיקה פיזית חסומה כשיש reference פעיל.
- **Verification:** upload אמיתי ל־R2 preview, קובץ לא תקין/גדול, duplicate hash, referenced delete ו־orphan scan.
- **Evidence:** נוסף domain media יחיד עם `GET/POST/PATCH/DELETE /api/media` ו־`GET /api/media/orphans`. upload מקבל raw body בלבד ומעביר את `ReadableStream` ישירות ל־R2; Content-Length חובה ומוגבל ל־12MB, MIME מוגבל לפורמטים שבחוזה, object key נוצר בשרת, dimensions/alt/checksum נבדקים ו־R2 מאמת SHA-256 בזמן הכתיבה. אין Base64. D1 שומר metadata בלבד, checksum unique מונע כפילות, וכשל metadata מוחק רק את object החדש כדי למנוע orphan. archive הוא soft-delete בלבד; physical delete אינו חשוף ב־API, ו־draft/published references נבדקים מחדש מול schema וחוסמים archive ב־`409`. אותם routes מטפלים ב־list, metadata, restore ו־orphan scan בלי implementations כפולים. ‏41/41 בדיקות סטודיו ו־full `pnpm validate` עברו. Wrangler local ו־Preview deployment `974ccb84` אישרו upload אמיתי של WebP ‏101,570 bytes, duplicate `409`, MIME ‏`415`, oversize ‏`413`, list, metadata update, archive/restore, referenced delete `409` ו־orphan scan ריק. נתוני D1/R2/session/draft הזמניים נמחקו במדויק אחרי שתי הבדיקות; Preview חזר ל־0 media ו־0 content rows. Commit `986829e` עבר CI `29722739332` ו־deploy `29722739333`; Production deployment `b578a7c7` מצביע אליו. Production החזיר `401` ל־media/orphan reads ללא session ו־`403` ל־mutation ללא Origin, שמר 0 media/content rows, והחזיר `200` ב־health ובשני ה־roots.

#### CF-008 — Implement atomic publish, rollback and workflow dispatch

- **Status:** `DONE`
- **Dependencies:** `CF-006`, `CF-007`.
- **Definition:** לפרסם revision תקין, לארכב את הקודם, ליצור `publish_job` ולהפעיל GitHub Actions מהשרת.
- **Acceptance criteria:** publish idempotent; רק revision תקין עם media קיימת מתפרסם; secret אינו נשלח ללקוח; כשל dispatch מתועד וניתן retry; rollback מפרסם revision קודם.
- **Verification:** publish/duplicate publish/dispatch failure/retry/rollback integration tests ובדיקת audit rows.
- **Evidence:** נוסף publish domain שרתי עם `POST /api/publish`, ‏`/retry`, ‏`/rollback` ו־`GET /api/publish/history`. Publish מאמת מחדש schema, version, metadata של כל media ואת קיום/גודל כל object ב־R2 לפני batch אטומי שמארכב published קודם, מפרסם draft ויוצר audit job עם idempotency key unique. Rollback יוצר revision published חדש מתוכן archived ושומר `source_revision_id`, בלי לשכתב היסטוריה. Dispatch ל־GitHub משתמש רק ב־secret שרת מוצפן, מסמן `deploying→dispatched/failed`, שומר error code נקי וניתן retry; double-submit מחזיר אותו job ללא attempt נוסף. migration ‏`0004_publish_job_audit.sql` הוחל מקומית וב־Preview וחזרה no-op, עם 4 migrations ו־0 FK violations. ‏44/44 בדיקות סטודיו ו־full `pnpm validate` עברו. Local ו־Preview deployment `3927f9fb` אישרו publish, duplicate idempotent, dispatch failure, retry, publish שני, rollback ו־audit statuses; בדיקת local object חסר החזירה `409`. כל rows/objects/sessions הזמניים נמחקו ו־Preview orphan scan חזר ריק. dispatch אמיתי ידני הפעיל workflow run `29723670205` בהצלחה, וה־GitHub token נשמר כ־`GITHUB_DISPATCH_TOKEN` מוצפן ב־Pages Production בלבד. Commit `25a2f4b` עבר CI `29723812878` ו־deploy `29723812837`; Production deployment `d8307825` מצביע אליו. לפני migration Production נשמר bookmark `0000000a-00000000-000050ae-a93685f1e0f52e19a6f7436869e7ce2c`; apply וחזרה no-op עברו עם 4 migrations, ‏0 FK violations ו־0 jobs/revisions/media. Production אישר history לא מאומת `401`, mutation ללא Origin `403`, secret מוצפן ו־health/public/studio `200`.

#### CF-009 — Replace Google build sync with published D1/R2 sync

- **Status:** `DONE`
- **Dependencies:** `CF-008`.
- **Definition:** לשנות את build כך שיוריד published snapshot ומדיה מ־Cloudflare, ישמר validation/optimization קיים וייצר אתר סטטי.
- **Acceptance criteria:** אין service account; רק media referenced יורדת; WebP/variants ו־dimensions נשמרים; build נכשל אם snapshot/media חסרים; fallback נשאר מפורש ללוקאל בלבד.
- **Verification:** clean CI-like build, hash/count comparison, broken-object test, media check והשוואת generated snapshot ל־published revision.
- **Evidence:** נוספו endpoints ציבוריים read-only ל־published revision ולמדיה referenced בלבד, עם schema validation בכל read, ‏ETag ו־cache contract; object שאינו referenced או חסר אינו ניתן להורדה. helper יחיד ב־`content-schema` מפיק media references ומשמש את archive guard, ה־API וה־build ללא לוגיקה כפולה. `content:sync:cloudflare` דורש origin מפורש ואין לו fallback סמוי: הוא מוריד snapshot v2, מוריד רק references, מאמת SHA-256 וגודל לכל object, מייצר WebP/variants ושומר גם snapshot v2 byte-equivalent וגם compatibility snapshot עבור האתר הקיים. output root ניתן להחלפה לבדיקות מבודדות בלי לפגוע בקבצים קיימים. workflow כולל lane חדש ללא service account כאשר repo variable ‏`PUBLIC_CONTENT_SOURCE=cloudflare`; lane ה־Google נשאר פעיל עד cutover `MIG-005` בלבד כי Production D1 עדיין ריק. Preview deployment `488d7cb3` אישר snapshot/media endpoints, 10 references, cache/ETag ו־checksum. clean CI-like workspace יצר 50 קובצי media, עבר exact snapshot comparison עם SHA `269ec5f5…`, ‏content/media checks ו־production build. מחיקת object מדגמית גרמה לכשל sync מפורש `404`; object שוחזר וה־checksum אומת. כל Preview test rows/objects/session נמחקו עם 0 FK violations. ‏20/20 schema tests, ‏44/44 studio tests ו־full `pnpm validate` עברו. Commit `68e6d9b` עבר CI `29724776801` ו־deploy `29724776832`; Production deployment `04a43bb6` מצביע אליו. ה־Cloudflare lane דולג כמתוכנן וה־legacy lane עבר עד cutover. Production החזיר `404 published_content_not_found` לשני endpoints משום שטרם בוצע import, נשאר עם 0 jobs/revisions/media ו־0 FK violations, ושני ה־roots וה־health החזירו `200`.

#### CF-010 — Add observability, budgets and operational runbook

- **Status:** `DONE`
- **Dependencies:** `CF-003`–`CF-009`.
- **Definition:** להוסיף structured logs ללא PII/secrets, usage monitoring, alerts/runbook ל־D1/R2/Functions ולתקציב החינמי.
- **Acceptance criteria:** request/publish IDs ניתנים למעקב; auth tokens ו־content body אינם בלוג; thresholds מתועדים; backup/restore/session-revoke/failed-publish procedures קיימים.
- **Verification:** simulated failures, log review, Cloudflare usage dashboard check ו־tabletop restore exercise.
- **Evidence:** נוסף observability domain יחיד עם events מובנים ל־`api_request` ול־`publish_job`. השדות הם allowlist בלבד: request/path ללא query/status/duration/errorCode ו־request/job/revision/operation/attempt; אין headers, cookies, principal, body, content או token. בדיקה ייעודית הזריקה query/header/cookie secrets ואישרה שאינם באירוע, ו־Production tail על deployment `a49b3f2a` הראה request IDs ניתנים למעקב, health ‏`200` ו־missing route ‏`404` עם structured path נקי. נוסף monitor יומי וידני מול Cloudflare GraphQL Analytics ו־D1 inventory, עם warning ב־70%, critical ב־85%, job summary וכשל מפורש ב־critical; סימולציות safe/critical יצאו 0/2. token קריאה ייעודי מוצפן מחזיק רק `Account Analytics:Read` ו־`D1:Read`; token ניסוי שנחשף במסך אישור בוטל ואומת לפני יצירת `v2`. run אמיתי `29726062902` עבר במצב `ok`: D1 reads ‏1,145, writes ‏480, storage ‏196,608 bytes, ‏R2 operations ‏80/storage ‏0 ו־Functions requests ‏0 בחלון. נוסף runbook נבדק אוטומטית עם מכסות רשמיות, גיבוי/manifest, Time Travel restore, session revoke, failed-publish retry/rollback וסגירת אירוע. תרגיל tabletop שמר bookmark ‏`0000000d-00000000-000050ae-b19f6ae0e8246a619f699b85a6460ec1`, תיקן את תחביר Wrangler בפועל, אישר migrations no-op, ‏0 FK violations ו־0 revisions/media/jobs/sessions בלי restore ל־Production. ‏45/45 בדיקות סטודיו ו־full `pnpm validate` עברו. Commits `1b59b7c`, ‏`8218447` ו־`b2ad28e`; CI `29726063501`, deploy `29726063331`, Usage Monitor `29726062902`, ו־Production deployment `a49b3f2a` כולם עברו; שני ה־roots וה־health החזירו `200`.

### Phase 5 — Data and media migration

#### MIG-001 — Create immutable Sheets/Drive backup and manifest

- **Status:** `DONE`
- **Dependencies:** `ARC-004`, `GOV-004`.
- **Definition:** לייצא את כל Sheets, רשימת Drive, generated snapshot וקובצי המדיה לפני mutation.
- **Acceptance criteria:** לכל file/row יש stable ID/hash; backup timestamped ו־read-only; credentials אינם בארכיון; הוראות restore מתועדות.
- **Verification:** schema validation, hash verification, counts מול המקור ושחזור sandbox מדגמי.
- **Evidence:** נוסף pipeline read-only שמסנכרן snapshot מדויק, מייצא את כל 5 ה־Sheets כולל properties ו־163 rows, מוריד 18 קובצי Drive מהתיקייה ומה־references, ושומר generated snapshot. לכל row יש stable ID ו־SHA-256 ולכל קובץ יש Drive ID, metadata, size, checksum ו־SHA-256; manifest עליון חותם את כל 22 קובצי הגיבוי. אין credentials בארכיון, וכל native Google file לא־ממופה חוסם את ה־run. Workflow `29726643009` יצר artifact ‏`8454529512` בגודל 5,717,784 bytes; הוא הורד ל־`backups/legacy-google/20260720T080523Z` (5.6MB), אומת מחדש לוקאלית, עבר schema/count/hash checks ו־sandbox restore, והוגדר read-only לפני commit. הוראות restore מדורגות נמצאות ב־README וה־artifact נשמר כעותק משני ל־90 יום. Commits `6440376` ו־`5a88cb5`; CI `29726754122` ו־deploy `29726754139` עברו, Production deployment `5f1fa1c0` מצביע ל־backup commit, ושני ה־roots וה־health החזירו `200`.

#### MIG-002 — Build a deterministic migration transformer

- **Status:** `DONE`
- **Dependencies:** `MIG-001`, `CF-002`, `ARC-002`.
- **Definition:** להמיר export קיים ל־D1 revisions ול־R2 manifest באמצעות קוד חד־פעמי repeatable שאינו משכפל את schema.
- **Acceptance criteria:** אותו input מפיק אותו output; IDs נשמרים; `driveFileId` ממופה ל־media ID/object key; retired sections archived; כל warning חוסם/מתועד במפורש.
- **Verification:** fixture tests, dry run כפול, output diff ו־`contentSnapshotSchema` validation.
- **Evidence:** נוסף transformer חד־פעמי typed שקורא ישירות את `contentSnapshotSchema`, ‏`publicSiteDocumentSchema`, ‏Drive manifest וה־backup manifest, ללא schema מקביל וללא clock/runtime randomness. הוא שומר את IDs הפעילים, ממפה 16 נכסי Drive ל־media IDs ולמפתחות R2 יציבים, יוצר revision v2 תקין, ומתעד בנפרד 6 פריטי gallery, ‏100 sections ושני קובצי Drive שאינם עוברים למסמך הפעיל. unknown groups, source חסר או counts בלתי צפויים חוסמים את ההמרה. שלוש בדיקות fixture עברו, כולל unknown group חוסם; שתי הרצות dry-run בתיקיות נפרדות היו byte-identical. תוצר קנוני נשמר ב־`migration/legacy-google/20260720T080523Z`: ‏`archive.json` ‏SHA `c4904a9c…`, ‏`r2-manifest.json` ‏SHA `be34d73a…`, ‏`revision.json` ‏SHA `e9d4e138…`, revision ID ‏`b5bd90fb-ded3-583c-ab50-8bfa17f2bd26`. ‏`publicSiteDocumentSchema` validation ו־full `pnpm validate` עברו. Commit `4e066b6`, ‏CI `29727541218` ו־deploy `29727541187` עברו; deployments ‏`7b78457a`/`51e41acb` נפרסו, ושני ה־roots וה־health החזירו `200` עם D1/R2 ready.

#### MIG-003 — Import and validate in preview

- **Status:** `DONE`
- **Dependencies:** `MIG-002`, `CF-006`, `CF-007`.
- **Definition:** לייבא את כל התוכן והמדיה ל־D1/R2 preview ולהריץ parity מלאה בלי להשפיע על production.
- **Acceptance criteria:** counts/IDs/hashes תואמים; כל media נפתחת; draft/published מוגדרים; אין orphan/duplicate object; admin bootstrap תקין.
- **Verification:** automated parity report, R2 object HEAD/read sampling, preview studio login ו־preview public build.
- **Evidence:** נוסף importer מוגבל בקוד ל־Preview בלבד, עם flag כתיבה מפורש, preflight שחוסם rows זרים, source SHA/bytes לפני העלאה, verification בהורדה מלאה מ־R2 ו־D1 parity לאחר כתיבה. לפני import נשמר Time Travel bookmark ‏`0000000d-00000000-000050ae-8614f9eb76c612c2e43f1018390cf725`. שתי הרצות מלאות עברו idempotently והשאירו 16 media rows עם 16 IDs/object keys/hashes ייחודיים, draft יחיד ‏`b5bd90fb-ded3-583c-ab50-8bfa17f2bd26`, published יחיד ‏`b6398b25-f48f-5eeb-a6a8-bbd4d83add2f`, ‏0 jobs ו־0 FK violations. כל 16 objects הורדו מחדש ואומתו byte-for-byte; authenticated Preview API deployment `2c1d0682` החזיר `200` ל־session/draft/media/orphans ול־published, עם 0 missing ו־0 orphan objects, וה־sessions הזמניים נמחקו. שני ה־content JSON זהים למקור עם normalized SHA ‏`3e2ea58a…`. clean Preview public sync הוריד 9 referenced objects, יצר 57 files, עבר content/media checks ו־build. בדיקת browser אישרה שה־studio Preview נטען; ה־UI הישן עדיין משתמש ב־Google Sheets עד Phase 6, בעוד login/session של API החדש אומת ישירות. ‏46/46 בדיקות סטודיו ו־full `pnpm validate` עברו. Commit `a16b747`, ‏CI `29728841864` ו־deploy `29728841874` עברו; deployments ‏`fc265dac`/`98dbe6b0` נפרסו ושני ה־roots וה־health החזירו `200`. Production נשאר עם 0 revisions/media/jobs/sessions ו־0 FK violations.

#### MIG-004 — Run the production freeze, delta import and cutover

- **Status:** `DONE`
- **Dependencies:** `MIG-003`, `ADM-008`, explicit cutover approval.
- **Definition:** לבצע חלון הקפאת כתיבה, delta export/import, parity ואז להעביר את הסטודיו ל־API החדש.
- **Acceptance criteria:** זמן freeze מתועד; אין delta חסר; owner flow עובר לפני פתיחת כתיבה; feature/config rollback יכול להחזיר את הסטודיו הישן במהלך החלון.
- **Verification:** signed cutover checklist, before/after hashes, authenticated owner smoke ו־audit log.
- **Evidence:** חלון ההקפאה החל ב־`2026-07-20T13:13:44Z`; מסך הסטודיו כבר לא החזיק Google write scopes ולכן לא נשאר נתיב כתיבה ל־Sheets/Drive. workflow גיבוי טרי `29745345594` יצר artifact ‏`8462164511` (`20260720T131439Z`) עם 5 Sheets/163 rows/18 Drive files. לאחר הסרת `updatedAt` הצפוי, snapshot ה־delta זהה למקור ההגירה עם אותם counts — 0 delta חסר. לפני mutation נשמר D1 bookmark ‏`00000025-00000000-000050ae-fac51a19b128051481b1cb1ec7448740`; Production היה 1 admin פעיל, ‏0 revisions/media/jobs/sessions/FK, ושלושת ה־health roots החזירו `200`. importer משותף ל־Preview/Production קיבל production target עם confirmation gate מפורש, העלה 16 objects ל־R2 רק אחרי source checksum, הוריד ואימת מחדש 16/16, ויצר draft ‏`b5bd90fb` ו־published ‏`b6398b25` עם checksum ‏`ded45021…`. parity: ‏1 draft, ‏1 published, ‏16 media/keys/checksums, ‏0 jobs/FK. owner smoke מאומת ב־Chrome טען את ששת החלקים, 16 media, preview/history/admin; שינוי Hero הפיך נשמר גרסה ‏1→2→3 והוחזר לתוכן המקורי (הבדל יחיד מול published הוא `updatedAt` audit). session/cookie הזמניים נמחקו וחזרו ל־0; anonymous חזר `401`. endpoint published החזיר schema v2/ETag ומדיית R2 מדגמית החזירה `200`, ‏453,816 bytes ו־checksum ETag. signed checklist ו־rollback המדויק ל־D1/R2/Pages נשמרו תחת migration. ‏138/138 בדיקות ו־full `pnpm validate` עברו. commit `27df281`; ‏CI `29752899522`, deploy `29752898113` ו־Cloudflare deployments ‏`0468b11e`/`9b20f62d` עברו; roots/health/published נשארו `200`, Production נשאר 1/1/16 ו־0 jobs/sessions/FK.

#### MIG-005 — Cut over the public build and prove rollback

- **Status:** `DONE`
- **Dependencies:** `MIG-004`, `CF-009`.
- **Definition:** להעביר CI מ־Google sync ל־D1/R2 sync, לפרוס ולבדוק גם publish חדש וגם rollback revision.
- **Acceptance criteria:** אותו published revision מגיע ל־generated snapshot ול־production; media סטטית תקינה; rollback מחזיר תוכן קודם; Sheets/Drive נשארים read-only בתקופת הביטחון.
- **Verification:** two-cycle E2E: publish → live verify → rollback → live verify, כולל SHA/revision/run IDs.
- **Evidence:** repo variable ‏`PUBLIC_CONTENT_SOURCE=cloudflare` הוגדר, ו־isolated local sync מול Production הוריד 9 media referenced, אימת checksum/bytes והפיק מסמך schema v2 עם 16 media ושישה sections. cutover run `29753303132` בנה בהצלחה רק דרך `cloudflare:build:site:d1`, דילג על legacy Google lane ופרס deployments ‏`d3ac476d`/`2744d12d`. מחזור E2E ראשון פרסם draft ‏`b5bd90fb` גרסה 3 דרך API מאומת עם idempotency; job ‏`5010889c` נשמר `dispatched` בניסיון 1, workflow `29753561045` צרך D1/R2 ופרס deployments ‏`73720f93`/`5f05b06d`; endpoint החי החזיר בדיוק revision זה, version 3 ו־updatedAt של הטיוטה. מחזור rollback יצר published revision ‏`d3896654` מתוכן המקור ‏`b6398b25` דרך job ‏`05c76da1` (`rollback`, ‏`dispatched`, attempt 1), workflow `29753803003` בנה שוב רק מ־D1/R2 ופרס deployments ‏`ae908615`/`1c66a62f`. endpoint החי חזר ל־updatedAt המקורי `2026-07-20T08:05:23.000Z` ול־Hero המקורי; Chrome Production אישר Version `legacy-20260720T080523Z`, בדיוק שישה sections לאחר lazy load, ‏12 תמונות/0 broken, ‏0 overflow ו־0 console warnings/errors. media נשארה 16, כל sessions הזמניים נוקו, ‏0 FK, ושני audit jobs נשמרו. Sheets/Drive והגיבויים נשארו read-only; ה־workflow הפעיל אינו משתמש יותר ב־service account.

#### MIG-006 — Retire Google content infrastructure

- **Status:** `DONE`
- **Dependencies:** `MIG-005`, stability window and explicit approval.
- **Definition:** להסיר Google Sheets/Drive/Picker/Apps Script/service-account paths, scopes, secrets וקוד תיעוד ישן לאחר אישור היציבות.
- **Acceptance criteria:** אין runtime/build reference ל־Sheets/Drive; OAuth מבקש identity בלבד; secrets ישנים בוטלו; backup נשמר לפי retention; docs מצביעים רק על D1/R2.
- **Verification:** `rg` audit, clean install/build/test, secret inventory, OAuth consent review ו־production publish נוסף.
- **Evidence:** לאחר חלון יציבות שכלל cutover, publish ו־rollback ועוד שלוש פריסות ירוקות, הוסר מסלול התוכן הישן בשלמותו: workflows של backup/seed, Apps Script proxy, service-account sync/backup/seed, משתני Sheets/Drive והסתעפות build נמחקו. `cloudflare:build:site` צורך כעת תמיד את published API של D1/R2; Google נשאר רק כ־Identity client. ‏`rg` ממוקד החזיר 0 runtime/build references ל־Sheets/Drive/Picker/Apps Script/service account מחוץ ל־backup/migration/history השמורים. types של Wrangler נוצרו מחדש ומכילים רק `GOOGLE_CLIENT_ID`/`VITE_GOOGLE_CLIENT_ID`; מסך OAuth החי מציג בדיוק `scope=openid email profile`. שלושת סודות GitHub הישנים (`GOOGLE_SERVICE_ACCOUNT_JSON`, ‏`VITE_GOOGLE_API_KEY`, ‏`VITE_GOOGLE_APPS_SCRIPT_PUBLISH_URL`) והמשתנה הזמני `PUBLIC_CONTENT_SOURCE` בוטלו; inventory סופי מכיל רק Cloudflare tokens ו־identity Client ID. הגיבוי הבלתי משתנה נשאר תחת `backups/legacy-google/20260720T080523Z`. תיעוד ה־Studio וה־content flow נכתב מחדש ל־D1/R2 בלבד. התקנה קפואה, ‏138/138 בדיקות, lint, type-check, builds, full `pnpm validate` ו־`parity:local:deploy` מול Production עברו. commit `252e024`; ‏CI `29754942258` ו־deploy `29754942311` עברו, עם deployments ‏`b6c9e567`/`60a7019f`. מחזור publish נוסף יצר revision ‏`083a07ec`, job ‏`451d29d2` במצב dispatched/attempt 1 ו־workflow `29755363705`; ה־API וה־build החי מצביעים לאותו revision, deployments ‏`a46bab8c`/`2c32ce8f`, ‏health/roots/published החזירו `200`, session הבדיקה נמחק במדויק ו־0 FK violations נשמרו.

### Phase 6 — Admin rebuild on the server/client contract

#### ADM-001 — Split the admin monolith into owned modules

- **Status:** `DONE`
- **Dependencies:** `ARC-003`, `CF-003`.
- **Definition:** לפרק את `App.tsx` ל־shell, routes/tabs ו־feature modules בלי ליצור wrappers או UI כפולים.
- **Acceptance criteria:** `App.tsx` הוא composition root; כל feature בקובץ/תיקייה ייעודיים; primitives משותפים reused; imports לפי public boundaries.
- **Verification:** component ownership review, dependency graph, type-check ו־duplication search.
- **Evidence:** `App.tsx` ירד מ־1,016 שורות ל־composition root של 3 שורות בלבד. מימוש ה־legacy כולו הועבר ל־feature boundary מבודד תחת `features/legacy`, וה־login gate, ניווט ה־tabs וה־primitives הגנריים פוצלו לקבצים ייעודיים; אין wrapper או component כפול. עורכי Google הישנים נשארו יחד רק בתוך migration feature יחיד כדי שיוחלפו בשלמות ב־ADM-002–ADM-007 בלי להריץ שתי מערכות או ליצור UI זמני. imports נשארו בכיוון App→feature→shared local modules, חיפוש declarations אישר owner יחיד לכל primitive/navigation/login. ‏46/46 בדיקות סטודיו, type-check, lint, full `pnpm validate` ושני builds עברו. browser מקומי ו־Production אישרו login shell זהה וללא console errors. Commit `811323d`, ‏CI `29729384252` ו־deploy `29729384250` עברו; deployments ‏`c1dd7b82`/`5a63196c` נפרסו ושני ה־roots וה־health החזירו `200`.

#### ADM-002 — Replace Google OAuth data access with session UX

- **Status:** `DONE`
- **Dependencies:** `CF-004`, `ADM-001`.
- **Definition:** להשתמש ב־Google רק לכניסה, להחליף access-token lifecycle ב־`/api/auth/*` cookie session ולהוסיף logout/session-expired UX.
- **Acceptance criteria:** אין Sheets/Drive scopes; אין token ב־storage/state מעבר לרגע exchange; refresh משחזר session; 401 מחזיר למסך כניסה בלי אובדן טיוטה מקומית לא צפוי.
- **Verification:** browser login/refresh/logout/expiry/revocation tests ו־storage/network inspection.
- **Evidence:** שכבת Google data הישנה נמחקה בשלמותה: אין OAuth scopes ל־Sheets/Drive, ‏Picker, access token, browser storage, editor allowlist או Google API/Sheet/Drive/Apps Script env בחבילת האדמין. Google Identity Services מחזיר ID credential חד־פעמי בלבד ל־`POST /api/auth/google`; client typed יחיד משתמש ב־same-origin credentials, ‏`GET /api/auth/session` משחזר cookie session אחרי refresh ו־`POST /api/auth/logout` מבטל אותה בשרת. `401` מעביר לכניסה דרך `expireSession` עם הודעה ששינויים מקומיים אינם נמחקים. CSP צומצם ל־Google Identity בלבד וה־header contract עודכן. בדיקות client/hook מכסות 401, credential exchange, restore ללא storage, expiry ו־logout; ‏42/42 בדיקות סטודיו ו־full `pnpm validate` עברו. Wrangler local + browser ב־`localhost:8788` אישרו login gate, session restore אחרי reload, authenticated shell ו־logout; session הבדיקה נשאר עם 0 active rows לאחר logout. audit ממוקד מצא 0 runtime references ל־Sheets/Drive scopes/Picker/access token. Commit `ea58359`, ‏CI `29730112539` ו־deploy `29730112487` עברו; deployments ‏`e0a1bac0`/`819bdb65` נפרסו. Production browser טען את Google Identity button תחת CSP מצומצם ללא CSP violations; authenticated session ו־logout החזירו `200`, ה־row בוטל ואז נמחק, ו־Production חזר ל־0 sessions ו־0 FK violations. שני ה־roots וה־health החזירו `200`.

#### ADM-003 — Build one typed API client and query-state layer

- **Status:** `DONE`
- **Dependencies:** `CF-003`, `ADM-001`.
- **Definition:** ליצור client יחיד ל־API עם credentials, schema parsing, error mapping, cancellation ו־retry מוגבל לקריאות idempotent.
- **Acceptance criteria:** feature modules אינם קוראים `fetch` ישירות; DTOs מגיעים מהחוזה המשותף; conflict/auth/network errors מובחנים; אין retry אוטומטי ל־publish/upload mutation.
- **Verification:** client unit tests, mocked failure matrix ו־`rg "fetch\("` שמאשר בעלות מרכזית.
- **Evidence:** `src/api/client.ts` הוא owner יחיד של `fetch`: הוא מוסיף same-origin credentials, cancellation, schema parsing, error mapping נפרד ל־auth/conflict/network/rate-limit/server/validation ושני retries לכל היותר ל־GET idempotent בלבד; mutations אינן נשלחות מחדש. `studioApi.ts` מרכז DTO schemas ו־domain methods, ו־`useStudioQuery` מרכז loading/success/error, cancellation ו־session expiry. ה־auth וה־shell הועברו לאותה שכבה, וטעינת draft אמיתית מחליפה placeholder. חיפוש `fetch(` תחת source/functions מצא קריאת runtime יחידה ב־client; ‏46/46 בדיקות סטודיו, failure matrix, full `pnpm validate`, lint, type-check ושני builds עברו. Commit `f4ae5b3`, ‏CI `29730800883` ו־deploy `29730800772` עברו; deployments ‏`563e2c65` Production ו־`15c79235` Preview מצביעים לאותו commit. Preview browser/session טען draft גרסה 1 דרך session/draft `200`, logout ביטל את ה־session וה־cleanup החזיר 0 sessions ו־0 FK violations. Production browser טען את login gate וה־Google button, bundle `index-BCVn9oaA.js` פעיל, שני ה־roots וה־health החזירו `200`, unauthenticated session החזיר `401`, ו־D1 נשאר עם 0 sessions/revisions/media ו־0 FK violations.

#### ADM-004 — Implement six-section content editing and preview

- **Status:** `DONE`
- **Dependencies:** `ADM-003`, `ARC-002`, `CF-006`.
- **Definition:** לבנות עורכים ברורים ל־Hero, Services, Gallery, Process, Trust ו־Contact על אותו `ContentSnapshot`.
- **Acceptance criteria:** אין legacy sections; validation field-level; dirty/conflict states ברורים; preview משתמש ב־`packages/site-preview`/shared contracts ולא ב־markup מועתק.
- **Verification:** load→edit→validate→save→reload לכל section, component tests ו־preview parity screenshots.
- **Evidence:** נוסף `ContentStudio` אחד עם navigation לששת חלקי v2: Hero, Services, Gallery, Process, Trust ו־Contact. `contentEditorModel` מייצר groups/fields מאותו `PublicSiteDocument` וממחזר `FieldControl` יחיד לכל text/textarea/select/media/checkbox, כך שאין טפסים או handlers משוכפלים. כל שינוי מסומן dirty, מזהיר לפני יציאה, עובר Zod field-level validation, נשמר עם `expectedVersion`, ו־auth/conflict/network מוצגים בנפרד בלי למחוק state מקומי. `PublicSiteDocumentPreview` נמצא ב־`packages/site-preview`, מקבל ישירות את החוזה המשותף ומציג את כל ששת החלקים בלי markup מועתק באדמין. ‏8 בדיקות רכיב חדשות כוללות load→edit→validate→save→reload לכל ששת החלקים, invalid field ו־conflict; ‏54/54 בדיקות סטודיו ו־full `pnpm validate` עברו. Wrangler local + דפדפן ברירת המחדל אישרו session, preview חי, dirty state, שמירת Hero מגרסה 1 ל־2 ו־reload ששמר את הערך; נתוני הבדיקה המקומיים נוקו ל־0 sessions/revisions ו־0 FK violations. Commit `6eb0546`, ‏CI `29732124343` ו־deploy `29732124329` עברו; deployments ‏`c0212f95` Preview ו־`5acccdab` Production מצביעים לאותו commit. Preview browser אישר session/draft/media/save/reload/logout כולם `200`, כולל ארבעה assets אמיתיים מה־R2; לאחר הבדיקה הטיוטה הוחזרה byte-equivalent למקור, לגרסה 1 ול־updated timestamp המקורי, עם 16 media, ‏0 sessions ו־0 FK violations. Production authenticated browser הציג נכון empty-draft, logout ביטל session, וה־cleanup החזיר 0 sessions/revisions/media ו־0 FK violations; roots/health החזירו `200`.

#### ADM-005 — Implement R2 media library and safe editing

- **Status:** `DONE`
- **Dependencies:** `ADM-003`, `CF-007`, `WEB-003`.
- **Definition:** לבנות library אחת ל־upload/select/alt/replace/archive/restore של תמונות ווידאו.
- **Acceptance criteria:** progress/error/retry; preview מקומי בטוח; alt חובה לשימוש ציבורי; reference count מוצג לפני archive; אותו picker משמש Hero/Services/Gallery.
- **Verification:** real preview uploads, invalid files, reuse same media, referenced delete, keyboard flow ו־mobile flow.
- **Evidence:** נוסף `MediaLibrary` יחיד שמשרת את Hero, ‏Services, ‏Gallery ואת מסך הניהול הכללי; הוא משתמש ב־typed API הקיים ל־list/upload/update/archive/restore וב־Dialog המשותף ל־focus trap, ‏Escape והחזרת focus. upload שולח raw body ב־XHR מרוכז עם SHA-256, dimensions, progress, שגיאה ו־retry, ללא Base64; alt נדרש לפני שימוש ציבורי ווידאו דורש poster. נוסף endpoint מאומת לקריאת קובצי טיוטה ישירות מ־R2, ולכן preview חי אינו תלוי בגרסה שפורסמה. רשימת המדיה מציגה שימושים בטיוטה ובגרסאות שרת, וחוסמת archive מקומית ובשרת לפני מחיקה רכה; IDs הותאמו גם לנכסי migration קריאים ולא רק UUID. ‏59/59 בדיקות סטודיו ו־full `pnpm validate` עברו. Wrangler local + Chrome אישרו upload PNG אמיתי 492,063 bytes ל־R2 עם progress 100%, preview, בחירה/החלפה, save ‏v1→v2→reload, reuse כפול `409`, alt edit, archive→restore, picker משותף ב־Hero/Services, mobile ‏500px ללא overflow, media/file ‏200 ו־orphan scan ריק. לאחר הבדיקה נמחקו שני objects וכל rows/sessions/revisions הזמניים; D1 חזר ל־0/0/0 ו־0 FK violations. Commit `9fe2a54`, ‏CI `29734691146` ו־deploy `29734691163` עברו; Production deployment `c394d49f` ו־Preview `5bc5be59` מצביעים לאותו commit. Preview אמיתי טען 16 assets, העלה PNG ‏143,919 bytes ל־R2, הציג progress/preview, חסם asset עם 3 שימושי טיוטה ו־2 גרסאות, החזיר duplicate ‏409, והשלים archive→restore, mobile ו־Escape→focus. ה־object/row/session נמחקו ו־Preview חזר ל־16 media, ‏2 revisions, ‏0 sessions/FK/orphans; Production נשאר 0/0/0 עם endpoints מאובטחים ב־401. שני ה־roots ושני health endpoints החזירו `200`.

#### ADM-006 — Implement admin management and session revocation

- **Status:** `DONE`
- **Dependencies:** `ADM-003`, `CF-004`, `CF-005`.
- **Definition:** להעביר ניהול אדמינים ל־D1 ולהוסיף add/activate/deactivate תוך הגנה מנעילה עצמית.
- **Acceptance criteria:** email normalized/unique; לא ניתן להשבית את האדמין הפעיל האחרון או את עצמך בלי handoff; deactivation מבטלת sessions; אין public bootstrap route.
- **Verification:** CRUD authorization tests, last-admin/self-deactivate tests ו־revoked browser session test.
- **Evidence:** נוסף domain repository מרכזי ל־D1 ו־API מאומת יחיד עבור list/add/activate/deactivate, עם Zod strict, אימייל מנורמל ו־unique, guard אטומי בשאילתת העדכון נגד השבתת החשבון הפעיל/המנהל האחרון, וביטול כל sessions בעת השבתה. session DTO כולל כעת admin ID מהשרת, וה־UI החדש מציג מנהלים, סטטוס Google, מספר חיבורים, הוספה, אישור מפורש להשבתה, הפעלה מחדש והסבר נעילה; אין bootstrap route ציבורי. נוספו בדיקות repository ו־component ל־normalization/duplicate, self/last-active, revoke/reactivate ו־confirmation; ‏65/65 בדיקות סטודיו ו־full `pnpm validate` עברו. Wrangler local + Chrome בשני contexts אישרו anonymous `401`, יצירה עם lowercase, self `409`, deactivate→session `401` בדפדפן השני, login gate, reactivate ו־mobile ללא overflow; נתוני הבדיקה נמחקו ו־FK check נשאר נקי. Commit `a2ccb76` עבר CI `29735767725` ו־deploy `29735767757`; Production deployments ‏`f38e2557` (studio) ו־`143a99a3` (public) עלו. שני roots ו־health החזירו `200`, bundle חי כולל את ממשק הניהול, `/api/admins` מחזיר `401` ללא session, ו־Production D1 נשאר עם מנהל פעיל יחיד, 0 sessions ו־0 FK violations.

#### ADM-007 — Implement draft, publish, history and rollback UX

- **Status:** `DONE`
- **Dependencies:** `ADM-004`, `ADM-005`, `CF-008`.
- **Definition:** להציג save state, revision history, publish progress/failure ו־rollback מפורש בלי לערבב save draft עם live deploy.
- **Acceptance criteria:** draft/published badges מדויקים; publish confirmation מציג revision; failed job ניתן retry; rollback דורש confirmation ומציג תוצאה; double-submit חסום.
- **Verification:** component/integration tests לכל state ו־authenticated preview workflow כולל dispatch failure.
- **Evidence:** נוסף `PublishPanel` יחיד המחובר ל־typed API הקיים ל־history/publish/retry/rollback, עם badges מדויקים לטיוטה ולגרסה החיה, חסימת פרסום כשיש שינוי לא שמור, confirmation הכולל revision/version, busy guard נגד double-submit, סטטוס dispatch שאינו מוצג בטעות כ־deployment completed, retry רק ל־failed job ו־rollback מפורש שיוצר audit חדש. לאחר publish ניתן לפתוח טיוטה חדשה מהתוכן החי בלי מנגנון תוכן מקביל. ‏5 בדיקות רכיב חדשות מכסות badges/dirty, confirmation/idempotency/double-submit, dispatch failure/retry, rollback ויצירת טיוטה; ‏70/70 בדיקות סטודיו ו־full `pnpm validate` עברו. Wrangler local + Chrome אישרו empty history ובקרת auth. Preview deployment `c0708653` מול D1/R2 האמיתיים אישר dirty publish guard, publish confirmation, failure `publish_dispatch_unconfigured`, retry attempt ‏1→2, rollback לגרסה חיה חדשה ופתיחת טיוטה מהגרסה החיה. לאחר הבדיקה Preview שוחזר ב־Time Travel ל־bookmark `00000013-00000000-000050ae-1dc470640bd16ec10565779e3c03b15a` ואומת עם שתי גרסאות המקור, 16 media, ‏0 jobs/sessions/FK. Commits `41a0acf` ו־`d0d9d73`; CI `29736709319` ו־deploy `29736709296` עברו. Production deployments ‏`96aae2c8`/`49395ef5` עלו, bundle חי כולל את כל פעולות הפרסום, history לא מאומת נשאר `401`, Production D1 נשאר עם 0 revisions/jobs/sessions/FK ושני roots/health החזירו `200`.

#### ADM-008 — Complete admin accessibility, resilience and E2E gate

- **Status:** `DONE`
- **Dependencies:** `ADM-002`–`ADM-007`.
- **Definition:** להשלים responsive, keyboard, focus, error recovery ו־owner E2E לפני cutover.
- **Acceptance criteria:** כל פעולה קריטית עובדת ב־375px ובדסקטופ; אין אובדן שינוי ללא warning; focus/errors נגישים; reload/network interruption ניתנים להתאוששות; owner flow מלא עובר ב־preview.
- **Verification:** axe + keyboard + mobile screenshots + network-offline tests + login→edit→upload→save→publish→history→rollback E2E.
- **Evidence:** נוספו banner נגיש למצב offline, שמירת שינויים מקומיים אחרי כשל רשת, warning ב־`beforeunload`, העברת focus לשדה validation הראשון, `role=alert` לשגיאות, ניהול focus מלא ל־confirmations עם Escape/restore, busy guard סינכרוני ו־idempotency key שנשמר גם אחרי network failure. בדיקת Preview חשפה ותיקנה פער אינטגרציה שבו `PublishPanel` החזיק draft ישן אחרי save; `ContentStudio` מעדכן כעת את query הקנוני מיד אחרי שמירה ובדיקת רגרסיה מאמתת זאת. ניגודיות הכפתור הראשי תוקנה לאחר Lighthouse. ‏72/72 בדיקות סטודיו ו־full `pnpm validate` עברו. Chrome מקומי ו־Preview deployments ‏`1203638b`/`ef62069b` אימתו login/session, edit, העלאת PNG ל־R2, החלפת hero, beforeunload ללא אובדן, save שנכשל offline ואז מצליח אחרי חזרת הרשת, publish/history עם `publish_dispatch_unconfigured`, rollback, keyboard focus/Escape, desktop ו־375×812 ללא overflow. Lighthouse snapshot בדסקטופ ובמובייל החזיר Accessibility ‏100 ו־Best Practices ‏100. כל mutations נוקו: Preview שוחזר ל־bookmark `00000015-00000000-000050ae-e0b75d8e6ac03f37b5ca57fffac8f458`, שני objects זמניים נמחקו מ־R2, והמצב אומת עם revisions ‏`b5bd90fb`/`b6398b25`, ‏16 media, ‏0 jobs/sessions/FK/missing/orphans. Commits `bd1e274`/`d6e4261`; CI `29738508380` ו־deploy `29738508448` עברו. Production deployments ‏`37321658`/`e2463839` עלו; roots/health החזירו `200`, history ללא session נשאר `401`, ה־CSS החי כולל את תיקון הניגודיות ו־Production D1 נשאר עם 0 revisions/media/jobs/sessions/FK.

### Phase 7 — Quality, regression and non-functional validation

#### QA-001 — Expand automated coverage

- **Status:** `DONE`
- **Dependencies:** `WEB-001`–`WEB-006`, `CF-001`–`CF-010`, `ADM-001`–`ADM-008`, `MIG-003`.
- **Definition:** לכסות contracts, rendering, interactions, forms, media ו־content migration בבדיקות אוטומטיות.
- **Acceptance criteria:**
  - unit tests לכל business transformation.
  - component tests לכל interaction קריטי.
  - regression tests שמוכיחים שה־legacy sections אינם חוזרים.
  - אין snapshots רחבים שמסתירים שגיאות משמעותיות.
- **Verification:** `npx pnpm@9.15.9 test` וסקירת coverage לפי risk, לא רק אחוז כולל.
- **Evidence:** נוספו בדיקות ממוקדות ל־business transformations בסיכון הגבוה: התאמת `PublicSiteDocument` לחוזה הציבורי תוך סינון media לא פעילה/לא נצרכת, מיפוי `dishes` ל־`salads`, בניית מודל העריכה לששת החלקים בלבד, עדכון nested immutable, ניקוי video אופציונלי, סינון media בארכיון וקידוד WhatsApp בעברית ובתווים שמורים. fixture כפול של מסמך ציבורי הועבר ל־`@monorepo/content-schema/test-fixtures` כ־test-only export יחיד. הכיסוי הקיים נסקר לפי risk ואומת עבור schema invariants, migration determinism, auth/session/security, D1 revisions, publish dispatch, rendering, navigation, gallery/lightbox, media library, form/CTA, save/publish/rollback ו־legacy-section regression. ‏`npx pnpm@9.15.9 test` עבר עם 133/133 בדיקות ב־35 קבצים: schema ‏20, preview ‏20, public ‏18 ו־studio ‏75. אין `toMatchSnapshot`/`toMatchInlineSnapshot` תחת `apps` או `packages`. ‏`npx pnpm@9.15.9 validate`, ‏lint, type-check וכל builds עברו; bundle sizes נשארו ללא שינוי. commit `7849089`; ‏CI `29739268107` ו־deploy `29739268106` עברו. Cloudflare deployments ‏`39eb7375`/`2d547fcb` והדומיינים החיים החזירו `200`, ‏health החזיר `200`, publish history ללא session החזיר `401`, ו־Production D1 נשאר עם 0 revisions/media/jobs/sessions/FK violations.

#### QA-002 — Verify accessibility

- **Status:** `DONE`
- **Dependencies:** `QA-001`.
- **Definition:** לבצע audit מלא ל־keyboard, focus, semantics, contrast, screen reader ו־reduced motion.
- **Acceptance criteria:**
  - אין violation קריטי/רציני בכלי האוטומטי שנבחר.
  - כל המסלול ניתן להשלמה במקלדת בלבד.
  - focus order תואם לסדר החזותי.
  - gallery dialog ו־mobile menu מנהלים focus נכון.
- **Verification:** axe/Playwright, keyboard walkthrough, contrast checker ו־screen reader smoke test.
- **Evidence:** Lighthouse/axe navigation audit מקומי וב־Production החזיר Accessibility ‏100 בדסקטופ ובמובייל, כולל `color-contrast` ‏1 וללא violation קריטי/רציני. keyboard walkthrough מלא חשף ותיקן שלושה פערים: skip link מעביר כעת focus ל־`main`; פתיחת תפריט המובייל מעבירה focus לקישור הראשון ו־Escape/בחירה מחזירים אותו לכפתור; ה־Dialog הגנרי מתעלם מאלמנטים עם `tabIndex=-1`, ולכן lightbox נפתח על כפתור הסגירה הגלוי, לוכד Tab/Shift+Tab, נסגר ב־Escape ומחזיר focus לתמונה. נוספו בדיקות regression משותפות, וכל 134 הבדיקות ו־full `pnpm validate` עברו. screen-reader/a11y-tree smoke ב־Chrome אימת `lang=he`, ‏`dir=rtl`, landmark יחיד מכל סוג, H1 יחיד, שישה sections עם `aria-labelledby` תקין, 0 controls ללא שם, 0 images ללא alt ו־0 duplicate IDs. ‏`prefers-reduced-motion: reduce` החי מבטל animation, חושף reveal ומקצר transitions. commit `ff52894`; ‏CI `29740055874` ו־deploy `29740055815` עברו. Cloudflare deployments ‏`2052d66f`/`e2f21af4` והדומיינים החיים החזירו `200`; Production D1 נשאר עם 0 revisions/media/jobs/sessions/FK violations. אזהרת preload ו־CSP eval שמופיעה רק בזמן Lighthouse אינן a11y violations ונשמרות לבדיקת QA-004.

#### QA-003 — Verify responsive visual quality

- **Status:** `DONE`
- **Dependencies:** `WEB-001`–`WEB-006`.
- **Definition:** לבצע visual QA מלא ב־375, 768, 1024 ו־1440 פיקסלים, כולל portrait/landscape רלוונטי.
- **Acceptance criteria:**
  - אין horizontal overflow.
  - אין טקסט חתוך, CTA מוסתר או media distortion.
  - spacing והיררכיית טקסט עקביים.
  - sticky/fixed elements אינם מסתירים תוכן.
- **Verification:** screenshots + DOM measurements + manual browser walkthrough.
- **Evidence:** Chrome local ו־Production נבדקו ב־375×812, ‏812×375, ‏768×1024, ‏1024×768 ו־1440×1000 עם viewport screenshots, full-page walkthrough ו־DOM measurements. בכל המידות: 0 horizontal overflow, ‏0 interactive elements מחוץ ל־viewport, ‏0 text clipping, ‏0 broken images, ‏0 media distortion ושישה sections בלבד. הבדיקה חשפה ותיקנה מצב שבו קפיצה מהירה בגלילה יכלה לדלג על `reveal` ולהשאיר אזורים שקופים; policy משותף חושף כעת גם element שכבר עבר מעל ה־viewport ונוספה בדיקת regression. ב־375px נמצא ותוקן גם overlap של ה־mobile sticky CTA עם קישורי הפוטר באמצעות mobile footer clearance ו־safe-area; ב־Production נמדדו 44px בין הקישור האחרון לסרגל בקצה הגלילה. spacing, hierarchy, cards, gallery/video, process, trust, form/footer ו־sticky/fixed elements נסקרו חזותית portrait/landscape. ‏135/135 בדיקות ו־full `pnpm validate` עברו. commit `870f412`; ‏CI `29741056702` ו־deploy `29741056760` עברו. Cloudflare deployments ‏`385b0df2`/`0d9e5b85`, bundle החי `index-Ggs8Bo4A.js`/`index-DzrhVpCg.css`, כל ה־roots/health `200`, ו־Production D1 עם 0 revisions/media/jobs/sessions/FK violations אומתו.

#### QA-004 — Verify performance and media budgets

- **Status:** `DONE`
- **Dependencies:** `QA-003`, `CF-007`, `CF-009`.
- **Definition:** למדוד ולהשוות לבסיס את LCP, CLS, TBT/INP, JS/CSS size ומדיה.
- **Acceptance criteria:**
  - אין regression לעומת baseline ללא החלטה מתועדת.
  - CLS נמוך מ־`0.1`.
  - hero media מותאם ואינו טוען וידאו כבד ללא צורך.
  - lazy loading אינו מציג אזורים ריקים או שובר גלריה.
- **Verification:** Lighthouse runs עקביים, bundle output, network waterfall ו־media check.
- **Evidence:** בוצעו trace-ים קרים עקביים ב־Chrome DevTools על Production ב־375×812, ‏Slow 4G ו־CPU×4. מול baseline של LCP ‏9.32s / CLS ‏0 / TBT ‏0, שלוש ריצות ה־build הסופי-שקול החזירו LCP ‏2.792s, ‏2.843s ו־3.814s (median ‏2.843s), והריצה הקרה על commit הסופי החזירה LCP ‏2.783s, ‏CLS ‏0.00 ו־TTFB ‏51ms. שתי long tasks של 192/143ms נותנות upper-bound של כ־235ms ל־TBT תחת throttle; בתרחיש אינטראקציה אמיתי של פתיחה/סגירת mobile menu וסינון גלריה Chrome מדד INP ‏65ms ו־CLS ‏0.00. זו החלטה מתועדת לקבל את העלייה המוגבלת ב־load-task לעומת baseline: responsiveness נשאר בטווח good, בעוד LCP השתפר בכ־70%; המשך פיצול render נשמר כאופטימיזציה עתידית ולא כחסם release. build מקומי: JS ‏345.57KB + lazy ‏10.58KB (gzip ‏101.81KB + ‏3.76KB), CSS ‏69.47KB (gzip ‏13.83KB). Production עם snapshot מרוחק: JS ‏364.98KB + lazy ‏10.58KB ו־CSS ‏69.47KB; העלייה מול baseline ‏339.60KB + ‏10.89KB / ‏60.27KB מתועדת ונובעת מתוכן remote מלא וממערכת העיצוב החדשה, ללא regression בפועל ב־CWV. הוסר preload סטטי כפול ושגוי; build-time plugin בוחר כעת את אותה תמונת Hero שה־UI בוחר גם בחוזה legacy וגם ב־v2, יוצר preload יחיד של `vegetable-focaccia`, ומדרגות CMS ‏720/960/1200 יחד עם `sizes` משותף גורמות למובייל להוריד 720px. Hero טוען תמונה eager/high בלבד וללא וידאו; וידאו הגלריה נשאר lazy section עם `preload=metadata` ו־206/abort לאחר metadata. ‏media check עבר ל־19 assets. walkthrough לאחר scroll+filter אימת שישה sections, ‏6→2→6 תמונות, 0 broken images, ‏0 invisible reveal, ‏0 overflow ו־0 console warnings/errors; תיקון regression שומר reveal state גם אחרי React rerender. ניסיון cache immutable ל־assets בוטל לאחר שזוהה deployment-race שבו SPA fallback יכול להישמר תחת URL של module; ה־bundle הסופי `index-DnfAUi1O.js` מוחזר `application/javascript` עם `must-revalidate`. ‏136/136 בדיקות ו־full `pnpm validate` עברו. commits ‏`0894e46`, ‏`c0c60a3`, ‏`38be1df`, ‏`7091a9e`, ‏`79f013d`, ‏`d2506e5`; ‏CI `29743975718` ו־deploy `29743975782` עברו; Cloudflare deployments ‏`378d269a`/`047355ba`, שני ה־roots ו־studio health החזירו `200`.

#### QA-005 — Perform duplication and architecture audit

- **Status:** `DONE`
- **Dependencies:** `QA-001`–`QA-004`.
- **Definition:** לבצע ביקורת סופית שמוכיחה שהמימוש לא יצר duplication, monolith חדש או boundary violation.
- **Acceptance criteria:**
  - אין component/markup/style/business logic כפולים.
  - `App.tsx` נשאר composition root ולא implementation monolith.
  - אין `any`, unsafe assertions, deep imports או circular dependencies חדשים.
  - shared abstractions אינן כלליות מדי ולכל אחת צרכנים ברורים.
- **Verification:** `rg`, lint/type-check, dependency graph, focused code review ו־diff audit.
- **Evidence:** בוצעה ביקורת focused על 117 קובצי מקור authored. ‏`jscpd` זיהה תחילה שלוש משפחות duplication אמיתיות ב־publish logging/repository ובפענוח שגיאות API; הן אוחדו ל־abstractions ממוקדות עם צרכנים ברורים, וסריקה חוזרת החזירה 0 clones ו־0 שורות/tokens כפולים. wrapper בדיקות עמוק הוסר וכל הצרכנים משתמשים ישירות ב־public test-fixtures subpath. ‏`madge` סרק 136 קבצים והחזיר 0 circular dependencies; `architecture:boundaries` עבר. חיפוש `rg` בקוד authored אישר 0 `any`, ‏0 `as unknown as` ו־0 `@ts-ignore`/`@ts-nocheck`; assertions שנמצאו הוחלפו ב־type guard וב־generated snapshot טיפוסי, ונתוני fallback הושלמו לחוזה המלא במקום לעקוף אותו. `App.tsx` נשאר composition root, ו־diff review לא מצא component/markup/style/business logic כפולים או abstraction כללית ללא owner. ‏137/137 בדיקות ב־36 קבצים, lint, type-check, content/media checks וכל builds עברו ב־full `pnpm validate`. commit `be59cea`; ‏CI `29745014493` ו־deploy `29745014576` עברו; Cloudflare deployments ‏`d183721a`/`6a9f12d5` עלו. Chrome Production אישר שישה sections באתר, login shell בסטודיו, bundles תקינים, 0 overflow ו־0 console warnings/errors (מלבד `401` צפוי ל־session אנונימי); כל בקשות ה־root/assets החזירו `200`.

### Phase 8 — Release and production closure

#### REL-001 — Run the full local gate

- **Status:** `DONE`
- **Dependencies:** `QA-001`–`QA-005`.
- **Definition:** להריץ את כל בדיקות הריפו בסביבת runtime תואמת CI.
- **Acceptance criteria:**
  - `pnpm doctor:runtime` עובר.
  - `npx pnpm@9.15.9 validate` עובר.
  - `npx pnpm@9.15.9 parity:local` עובר.
  - `npx pnpm@9.15.9 audit --prod` ללא finding לא מטופל.
- **Verification:** פלטי הפקודות וקודי יציאה מתועדים.
- **Evidence:** שער release מלא הורץ לאחר סגירת migration: ‏`doctor:runtime` עבר עם pnpm ‏9.15.9; ‏`validate` עבר עם 138/138 בדיקות, lint, type-check, content/media/security/architecture checks וכל builds; ‏`parity:local` ביצע שוב התקנה קפואה ואת אותו gate; ‏`pnpm audit --prod` החזיר `No known vulnerabilities found`. כל הפקודות הסתיימו בקוד יציאה 0.

#### REL-002 — Deploy through the approved workflow

- **Status:** `DONE`
- **Dependencies:** `REL-001`, explicit user approval to publish.
- **Definition:** לבצע commit/push/deploy רק לאחר אישור מפורש, דרך GitHub Actions ו־Cloudflare Pages הקיימים.
- **Acceptance criteria:**
  - commit scope נקי ואינו כולל artifacts או שינויים לא קשורים.
  - CI ו־deploy jobs ירוקים עבור אותו SHA.
  - לא בוצע bypass ל־content sync או security headers.
- **Verification:** git diff, workflow run IDs ו־Cloudflare deploy result.
- **Evidence:** ההרשאה המפורשת של המשתמש להפעלה עד להשלמה שימשה כשער הפרסום. commit המימוש `252e024` ו־commit המעקב `24bd5b5` נדחפו ל־`main` בלי staging של `.playwright-cli` או generated/media artifacts מקומיים. עבור SHA הסופי `24bd5b5`, ‏CI `29755722642` ו־deploy `29755722919` עברו; ה־workflow ביצע validation, build ציבורי מה־published D1/R2, build Studio, שתי פריסות Pages ובדיקת robots ללא bypass. deployments ‏`bdcd977c` ו־`340585d3` מצביעים לאותו SHA.

#### REL-003 — Verify production end to end

- **Status:** `DONE`
- **Dependencies:** `REL-002`.
- **Definition:** לאמת שהאתר החי מציג את המבנה החדש ועובד בכל המסלולים הקריטיים.
- **Acceptance criteria:**
  - production מציג בדיוק שישה `main` sections מתוכננים.
  - כל navigation anchor, CTA, gallery, video, FAQ וטופס עובדים.
  - HTTP 200 ו־security headers תקינים.
  - אין console errors או blocked CSP requests.
  - mobile ו־desktop production תואמים ל־QA המאושר.
- **Verification:** Chrome/Playwright, live DOM count, `curl -I`, console/network review ו־WhatsApp link assertions.
- **Evidence:** Chrome Production על `24bd5b5` נבדק ב־1440×1000 וב־375×812. בשתי המידות נמצאו בדיוק שישה `main > section`, ‏0 overflow, ‏0 interactive elements מחוץ ל־viewport, ‏0 תמונות שבורות ו־12 תמונות תקינות. כל חמשת anchors קיימים וקפיצה ל־`#gallery` הציבה את החלק בראש viewport; תפריט mobile נפתח עם `aria-expanded=true`. גלריה עברה 6→2→6 items, lightbox נפתח, וידאו 13.88s עם `preload=metadata` ניגן ונעצר. FAQ נפתח עם `aria-expanded=true`. טופס ריק הציג שלוש שגיאות והעביר focus לשם; מילוי שם/טלפון/שירות ניווט ל־WhatsApp עם הודעה מקודדת מלאה בלי לשלוח אותה. כל CTA קיבלו `wa.me`/`tel`/`mailto` תקינים. network review הראה רק `200/204/206/304`, ללא בקשה חסומה; console הכיל 0 errors (הודעות CSP על eval נוצרו רק מה־DevTools inspection עצמו, לא מקוד האתר). roots ו־GET health/published החזירו `200`; published ETag מצביע ל־revision ‏`083a07ec`, ו־CSP/HSTS/nosniff/frame/referrer headers אומתו.

#### REL-004 — Close documentation and tracking

- **Status:** `DONE`
- **Dependencies:** `REL-003`.
- **Definition:** לעדכן tracker, README/history, content-flow וה־vault כך שישקפו את המצב החי הסופי.
- **Acceptance criteria:**
  - כל משימה נסגרה עם evidence או בוטלה עם reason.
  - open risks ו־follow-ups מתועדים.
  - docs אינם מתארים sections או admin flow ישנים.
  - tracker מסומן `completed` רק לאחר אימות production.
- **Verification:** docs-to-code/live parity review ו־final diff check.
- **Evidence:** tracker frontmatter ושער המימוש סומנו `completed/closed`; כל 51 המשימות הן `DONE` עם evidence. Progress summary עודכן ל־51/51 וכל phases מסומנים Done. ה־risk register נסגר ל־Closed/Mitigated עם `RISK-013` ב־Monitoring ו־follow-ups מפורשים שאינם חוסמי release. `README`, ‏`CONTENT_STUDIO.md`, ‏`docs/content-flow.md` ו־current snapshot ב־`docs/history.md` מתארים D1/R2 ו־Google Identity בלבד; baseline ישן ב־tracker/history מסומן במפורש כהיסטורי. generated production-sync ו־browser artifacts נוספו ל־`.gitignore` כדי שלא ייכנסו ל־commit. docs-to-code audit החזיר 0 references פעילים ל־legacy env/build paths; live published API מצביע ל־revision ‏`083a07ec`, schema v2 וששת חלקי האתר. final diff check ו־tracker check עברו לפני סגירה.

### Phase 9 — Theme maintainability

#### UI-005 — Make the public palette centrally swappable without visual drift

- **Status:** `DONE`
- **Dependencies:** `UI-001`, `QA-002`, `REL-004`.
- **Definition:** לבנות חוזה צבעים מרכזי וברור ב־`packages/site-preview/src/styles/tokens.css`, להעביר אליו את כל ערכי הצבע של האתר וה־Studio preview ולהשאיר את הפלטה הנוכחית ללא שינוי חזותי.
- **Acceptance criteria:**
  - כל צבעי המותג, המשטחים, הטקסט, הגבולות, ה־overlays, הגרדיאנטים והצללים מוגדרים פעם אחת ב־`tokens.css`; בקובצי `base.css` ו־`theme.css` אין literals של `hex`, ‏`rgb`, ‏`rgba` או `hsl` מלבד ערכים ניטרליים שאושרו במפורש על ידי הבדיקה.
  - קיימת הפרדה ברורה בין palette primitives לבין semantic role tokens, עם שמות שמאפשרים להבין איזה תפקיד משתנה ללא חיפוש selectors.
  - האתר הציבורי ממשיך לצרוך שכבת styles יחידה בבעלות `packages/site-preview`; ה־Studio ממשיך לצרוך את ה־preview component והחוזה המשותפים, בלי להעתיק אליו selectors של האתר או ליצור theme implementation מקביל.
  - computed colors, gradients, shadows ו־contrast של הפלטה הנוכחית נשארים זהים לפני ואחרי הרפקטור ב־desktop וב־mobile.
  - בדיקה אוטומטית נכשלת אם צבע מותג קשיח חוזר ל־`base.css` או ל־`theme.css`, והיא חלק מ־`pnpm validate`.
- **Verification:** audit אוטומטי של literals ו־token references; `pnpm design:tokens:check`; ‏`pnpm validate`; השוואת computed styles ב־375px וב־1440px מול production וצילומי מסך חזותיים; component/build validation ל־Studio preview; Lighthouse contrast; לאחר push — CI/deploy ואימות production של שני המשטחים ללא overflow, broken media או console errors.
- **Evidence (2026-07-20–21):** tracker נקרא מחדש; audit baseline מצא 351 מופעי צבע ישירים ב־`base.css`/`theme.css` (178/173), ‏50 ערכי RGB בסיסיים ו־19 ערכי hex. כל 351 המופעים הועברו ל־`tokens.css`, שנבנה כעת משכבת palette primitives, ערוצי RGB לשקיפויות וחוזה semantic פעיל; audit חוזר מצא 0 raw colors בשני קובצי ה־styles וב־CSS הכניסה הציבורי. ‏`design:tokens:check` אוכף גם הגדרה וגם צריכה של semantic roles ונשאר חלק מ־`validate`. שינוי ב־CSS המשותף נוסף ל־`turbo.json` כ־global dependency לאחר ש־audit גילה cache hit שגוי; הרצה רגילה שלאחר התיקון בנתה מחדש את שני היישומים. ‏`pnpm validate` עבר עם 138/138 בדיקות, lint, type-check, architecture/security/content/media וכל builds. בדפדפן ב־375×812 וב־1440×1000 הושוו 16 selectors ותשעה מאפייני computed color/gradient/shadow מול production: כל הערכים זהים, מלבד serialization שקול של `0%/100%` בגרדיאנט ה־Hero; אין overflow, media שבורה או console errors. Lighthouse מקומי החזיר Accessibility ‏100, contrast pass, ‏CLS 0 ו־Performance ‏77. ה־public CSS עלה מ־69.47KB/13.83KB gzip ל־82.30KB/14.98KB gzip; תוספת gzip ‏1.15KB התקבלה עבור חוזה palette מרכזי. commit `b3b493e` עבר CI `29760391196` ו־deploy `29760391044`. האתר החי מגיש asset שמכיל את חוזה `--theme-*`; בדיקות production ב־1440px וב־375×812 אישרו את כל חלקי המסלול, 0 overflow, ‏0 broken media ו־0 console warnings/errors. ה־Studio החי הציג את login shell ללא overflow או media שבורה; `401` של `/api/auth/session` ללא session הוא מצב האבטחה הצפוי. המשימה נסגרה `DONE` ללא שינוי בפלטה הפעילה.

### Phase 10 — Scroll storytelling

#### UI-006 — Add progressive scroll motion without structural drift

- **Status:** `DONE`
- **Dependencies:** `UI-004`, `QA-002`, `QA-003`, `QA-004`, `REL-004`.
- **Definition:** להרחיב את מנגנון ה־reveal הקיים ל־API גנרי ומודולרי עבור Scroll-Triggered Animations ולהוסיף Scroll-Driven media motion עדין ב־progressive enhancement, בלי לשנות hierarchy, תוכן, business logic, navigation, forms, component names, props או public APIs קיימים.
- **Acceptance criteria:**
  - `useScrollAnimation` גנרי תומך ב־variant/direction, ‏delay, ‏duration, ‏threshold, ‏stagger ו־once; `useRevealOnScroll` נשאר תואם ואינו נשבר.
  - נעשה שימוש ב־IntersectionObserver יחיד וב־CSS compositor properties בלבד; אין scroll hijacking, lock, smooth-scroll override, listener כבד או dependency חדש.
  - Scroll-Driven Animations מופעלות רק תחת feature detection ומתמקדות במספר קטן של אזורי media; fallback ללא JS/ללא תמיכה מציג את כל התוכן והמבנה ללא שינוי.
  - `prefers-reduced-motion: reduce` מציג הכול מיד ומבטל transform, transition ו־scroll timeline motion; screen readers, keyboard focus וסדר ה־DOM אינם משתנים.
  - האתר נשאר זהה מבחינת צבעים, טיפוגרפיה, spacing, sizes, content ופעולות; אין CLS או horizontal overflow ב־desktop/tablet/mobile.
  - gate אוטומטי חוסם animation רציפה, layout-property animation, ‏`transition: all`, scroll hijacking או reduced-motion לא מלא.
- **Verification:** unit tests ל־policy/config/fallback/stagger/once; ‏`pnpm motion:check`; ‏`pnpm validate`; דפדפן ב־375×812, ‏768×1024 ו־1440×1000; reduced-motion ו־JavaScript-disabled fallback; בדיקות navigation/gallery/lightbox/FAQ/form/keyboard; performance trace, CLS/overflow/console/network; לאחר push — CI/deploy ואימות production.
- **Evidence (2026-07-21):** ניסיון ראשון ב־commit `005b9fa` עבר בדיקות ופריסה אך נפסל לאחר שבדיקת frame-level הוכיחה שה־reveal duration נעלם במצב `is-visible`; הוא נשמר לצורך audit בלבד ואינו הוכחת השלמה. במימוש המחודש ה־transition הועבר לבעלות `.scroll-motion-ready .reveal` ולכן נשאר פעיל בשני המצבים; DevTools מדד opacity ‏0→0.69→1 ו־translateY ‏42px→13px→0 לאורך 680ms עם שני `CSSTransition` פעילים. נוספו עשרה scroll-linked animations תחת feature detection ובאמצעות named view timelines בבעלות sections: Hero depth/exit, שירותי media depth, gallery sticky journey + alternating image depth, process rail + sequential markers ו־trust image journey. Contact ויתר התוכן משתמשים ב־reveal/stagger מובחנים; אין wrapper, שינוי hierarchy, content, props, state, business logic או dependency חדש. `motion:check` חוסם מעתה transition שקיים רק ב־hidden state ודורש named timeline, animation range ו־reduced path. ‏141/141 בדיקות, lint, type-check, builds, ‏`pnpm validate`, ‏`parity:local` ו־`git diff --check` עברו. Chrome ב־375×812, ‏768×1024 ו־1440×1000 מדד 30/30 reveals, עד 21 transitions פעילות בזמן walkthrough, כל עשרת ה־scene names, ‏0 overflow, ‏0 broken media ו־0 console errors. gallery ‏6→2, lightbox open/Escape-close, FAQ open וטופס עם 3 errors/focus לשם נשארו תקינים. קו התהליך התקדם בפועל scale ‏0→0.48→0.92→1; Hero, services, gallery ו־trust שינו transform/progress בין נקודות גלילה. fallback ללא root motion class הציג 30/30 עם 0 animations. Chrome אמיתי עם `prefers-reduced-motion: reduce` הציג 30/30, ‏0 transitions, ‏0 scene animations ו־0 transforms. trace ב־375px תחת Fast 4G ו־CPU×4: LCP ‏741ms ו־CLS ‏0.00. bundle ציבורי: CSS ‏89.53KB/16.15KB gzip, main JS ‏346.93KB/102.26KB gzip ו־lazy ‏11.88KB/3.97KB gzip. commit `9d8ce60`, ‏CI `29787056691` ו־deploy `29787056709` עברו; בדיקת Production אישרה Hero רציף, reveal פעיל 680ms וקו תהליך scale ‏0.07→0.67→1, אך קפיצת גלילה מהירה במיוחד השאירה 3/30 פריטים שקופים משום ש־IntersectionObserver אינו מחויב לדווח על אלמנט שיחס החיתוך שלו נשאר 0 משני צדי הקפיצה. תיקון ממוקד מרחיב את observer root כלפי מעלה לאורך גובה המסמך וה־viewport, כך שאלמנט שקפץ מעל המסך משנה מצב חיתוך בלי listener חדש; regression ייעודי נוסף. ‏142/142 בדיקות, full `validate`, ‏`parity:local`, tracker ו־diff checks עברו. קפיצת גלילה אחת של 10,000–12,000px ב־1440×1000, ‏768×1024 ו־375×812 הסתיימה בכל מידה עם 30/30 visible, ‏0 hidden, ‏0 overflow ו־0 broken media. commit התיקון `3b240df`, ‏CI `29787579164` ו־deploy `29787579149` עברו; deployments ‏`373b8509`/`c9ea210f` עלו. אותו fast-scroll ב־Production הסתיים בשלושת ה־breakpoints עם 30/30 visible, ‏0 hidden, ‏0 overflow, ‏0 broken media ו־console נקי. ה־bundle החי `index-B8kt1uHG.js` מחזיר JavaScript ‏200; ששת ה־sections, תשעת animation names של elements ו־`process-rail-grow` העשירי עם `--process-scene` פעילים. public/studio/health/published החזירו `200`, ו־session אנונימי החזיר `401` כמצופה. `UI-006` נסגרה `DONE`.

### Phase 11 — Hero art direction

#### UI-007 — Build a cinematic editorial Hero from the approved buffet media

- **Status:** `DONE`
- **Dependencies:** `UI-005`, `UI-006`, `REL-004`.
- **Definition:** להפוך את ה־Hero הקיים לקומפוזיציה editorial גדולה וייחודית: צילום `event-buffet-salad-rolls` יהיה המדיה הראשית, הכותרת תשבור בעדינות את גבול הטקסט/צילום, ה־CTA והערכים יישארו ברורים, ו־`hosting-table-overview` יישאר באזור האמון כהוכחת היקף — בלי לשנות hierarchy, component API, תוכן עסקי, פלטה או לוגיקה.
- **Acceptance criteria:**
  - המבנה הקיים נשמר: `HeroSection`, ה־props, סדר ה־DOM, הניווט, ה־CTA והערכים אינם משתנים; השינוי מבוסס CSS ותוכן קיים ב־D1/R2 בלבד.
  - Desktop מציג צילום אנכי דומיננטי, כותרת גדולה החוצה את קו הקומפוזיציה אך אינה מכסה אוכל קריטי, וטקסט/CTA קריאים ללא collage או רכיב נוסף שמתחרה בסקשן השירותים.
  - Tablet ו־mobile מציגים crop מותאם, סדר קריאה טבעי, CTA מלאים ו־Hero שאינו חוסם את המשך העמוד; אין overflow אופקי או טקסט חתוך.
  - `event-buffet-salad-rolls` נבחר כ־Hero revision דרך ה־Studio וצילום השפע שסופק נבחר כמדיית ה־Trust; D1/R2 נשארים מקור האמת היחיד ואין asset כפול ב־repo.
  - תנועת ה־Hero הקיימת, `prefers-reduced-motion`, fallback ללא JavaScript, focus, contrast, preload ו־responsive image variants ממשיכים לעבוד ללא CLS.
  - אין שינוי בצבעים, בטיפוגרפיה, בששת הסקשנים, בטפסים, בגלריה או בלוגיקה עסקית.
- **Verification:** `pnpm tracker:check`, ‏`pnpm design:tokens:check`, ‏`pnpm motion:check`, ‏tests/type-check/lint/build/full `pnpm validate`, ‏`parity:local`; בדפדפן ב־1440×1000, ‏768×1024 ו־375×812 עם screenshot/computed checks ל־overflow, crop, heading, CTA, media, console ו־interactions; לאחר save/publish/push — CI/deploy ואימות public/Studio/health/published בפרודקשן.
- **Evidence (2026-07-21):** ה־tracker והארכיטקטורה נקראו מחדש. צילום ה־Hero שסופק תואם לנכס הקיים `event-buffet-salad-rolls`; בבדיקת צילום ה־Trust נמצא שהרשומה הישנה `hosting-table-overview` מצביעה בפועל לצילום quiche ואינה התמונה שסופקה. התמונה הנכונה הועלתה פעם אחת ל־R2 תחת `originals/6cd8987a-d827-4c4f-b965-25edd216b3c5/nis-trust-buffet-table.jpg` ונרשמה ב־D1 כ־`6cd8987a-d827-4c4f-b965-25edd216b3c5`; checksum ‏`6230e2154384f6dd85826802e131996bb35597b68ad6cd00ee44d05f5187ecc3` וגודל ‏99,122 bytes אומתו מחדש מול R2 ו־D1. קומפוזיציית ה־Hero הוטמעה ב־`theme.css`: frame editorial אנכי, כותרת החוצה בפועל את קו המדיה, gradient קריאות, CTA/ערכים שמורים ו־mobile overlap ללא שינוי DOM או component API. גובה tablet תוקן כך שהמסר וה־CTA נכנסים למסלול הגלילה הראשון. adapter ה־public ממפה כעת את trust/hero לשני תפקידי המדיה ו־`TrustSection` צורכת את מדיית trust בלי API חדש; בדיקות regression עודכנו. screenshots מקומיים ב־1440×1000, ‏768×1024 ו־375×812 אישרו Hero תקין, 0 overflow, ‏0 broken images ו־0 console errors. full `pnpm validate`, ‏`parity:local` ו־`git diff --check` עברו. commit `e585ec1`; ‏CI `29859294624` ו־deploy הקוד `29859294534` עברו. טיוטת Studio ‏`10d0356c` גרסה 2 פורסמה והפעילה deploy תוכן `29859479384`, שעבר. ה־published API מאשר Hero ‏`event-buffet-salad-rolls`, ‏Trust ‏`6cd8987a-d827-4c4f-b965-25edd216b3c5` ושני הנכסים במסמך החי. Production ב־1440×1000, ‏768×1024 ו־375×812 אישר את הקומפוזיציה ואת שני הצילומים, 0 overflow, ‏0 broken images, ‏0 console warnings/errors ו־mobile sticky CTA תקין; public, Studio ו־health החזירו `200`/ready. `UI-007` נסגרה `DONE`.

### Phase 12 — Services art direction

#### UI-008 — Turn the three services into an editorial choice table

- **Status:** `DONE`
- **Dependencies:** `UI-006`, `UI-007`, `WEB-002`.
- **Definition:** לשפר רק את `#experiences` באותה שפה editorial של ה־Hero: להפוך שלושה כרטיסים שווי־משקל לקומפוזיציית בחירה אסימטרית עם שירות מוביל, שני שירותים משלימים, מספור וקווים דקים — בלי לשנות את `ServicesSection`, ‏`ServiceCard`, סדר ה־DOM, תוכן, CTA, תמונות, props או לוגיקה.
- **Acceptance criteria:**
  - Desktop משתמש בגריד editorial אסימטרי: הכרטיס הראשון מקבל נוכחות מובילה ושני הכרטיסים האחרים נערמים לצדו; כל שלושת השירותים נשארים גלויים יחד וללא carousel, tabs או מצב נסתר.
  - כותרת הסקשן, המספור, קווי ההפרדה, הטיפול בתמונה וה־CTA ממשיכים את שפת ה־Hero באמצעות אותם tokens, טיפוגרפיה ופלטה; אין redesign של חלקים אחרים.
  - Tablet ו־mobile עוברים לסדר קריאה טבעי של שלושה כרטיסים מלאים; אין גובה קשיח שחוסם תוכן, overflow אופקי, טקסט חתוך או CTA מוסתר בידי הסרגל הדביק.
  - אין שינוי hierarchy, markup, component API, state, תוכן עסקי, מדיה, WhatsApp links או named scroll animations; `prefers-reduced-motion` וה־fallback ללא JavaScript נשארים תקינים.
  - השינוי ממוקד ב־CSS ובבדיקות regression הכרחיות בלבד; אין selector או component כפול ואין raw color חדש.
- **Verification:** `pnpm tracker:check`, ‏`pnpm design:tokens:check`, ‏`pnpm motion:check`, ‏tests/type-check/lint/build/full `pnpm validate`, ‏`parity:local`; בדפדפן ב־1440×1000, ‏768×1024 ו־375×812 עם screenshot/computed checks ל־grid, סדר, overflow, cards, CTA, images, console ו־WhatsApp href; לאחר push — CI/deploy ואימות public/Studio/health/published בפרודקשן.
- **Evidence (2026-07-21):** מקור האמת, הארכיטקטורה, `ServicesSection`, ‏`ServiceCard`, CSS והבדיקות נקראו מחדש. baseline חי ב־1728×962 אישר שלושה כרטיסים שווי־רוחב בגובה כ־555–566px; כל התוכן והפעולות תקינים אך אין היררכיה חזותית שממשיכה את ה־Hero. נבחרה והוטמעה ב־`theme.css` קומפוזיציית “שולחן בחירה” editorial: כרטיס ראשון מוביל בגובה 784px ושני כרטיסים משלימים בגובה 384px, מספור 01–03, כותרת מפוצלת וקווי מערכת — ללא שינוי DOM, component API, תוכן, מדיה או לוגיקה. ב־768×1024 וב־375×812 שלושת הכרטיסים עוברים לסדר אנכי מלא; כל CTA בגובה 48px ויכול להיכנס במלואו מעל ה־sticky CTA. בדיקות דפדפן מקומיות בשלושת ה־breakpoints אישרו 3/3 כרטיסים, סדר נכון, WhatsApp href תקין, anchor heading מתחת ל־header, ‏0 overflow, ‏0 broken images ו־0 console warnings/errors. כל 142 הבדיקות, `tracker:check`, ‏`design:tokens:check`, ‏`motion:check`, lint, type-check, builds, full `pnpm validate`, ‏`parity:local` ו־`git diff --check` עברו. commit `7e2f38e`; ‏CI `29861024560` ו־Cloudflare deploy `29861024555` עברו. Production ב־1728×906, ‏1440×1000, ‏768×1024 ו־375×812 אישר שלושה כרטיסים, היררכיית desktop, stack מלא ב־tablet/mobile, כל CTA בגובה 48px במסכים הצרים, WhatsApp href שמור, ‏0 overflow, ‏0 broken images ו־0 console warnings/errors. `UI-008` נסגרה `DONE`.
- **Reopen note (2026-07-21):** המשתמש קבע שהמימוש אמנם מסודר, אך אינו מספק את אפקט ה־“וואו” ואינו מרגיש כהמשך ישיר ל־Hero. התיקון המתוכנן שומר את אותה קומפוזיציית desktop ואת כל החוזים, אך הופך את הסקשן ל־cinematic dark chapter: תמונות full-bleed, copy ו־CTA כשכבה בתוך התמונה, מספור גדול, כותרת בקנה המידה של ה־Hero, רקע ink רציף וכניסת scroll אחת ממוקדת. ב־tablet/mobile הכרטיסים נשארים stack מלא וקריא עם gradient מקומי; reduced-motion נשאר ללא תנועה.
- **Reopened implementation evidence (2026-07-21):** `#experiences` הוסב ב־CSS בלבד לפרק קולנועי כהה שממשיך ישירות את ה־Hero: מעבר זוויתי, כותרת בקנה מידה של ה־Hero, רקע ink/plum, מספור 01–03 דומיננטי, תמונה גדולה בכרטיס המוביל ושתי תמונות full-bleed בכרטיסים המשלימים. ה־DOM, הקומפוננטות, ה־props, התוכן, סדר השירותים, המדיה, הקישורים והלוגיקה לא השתנו. בדיקות מקומיות ב־1440×1000, ‏768×1024 ו־375×812 אישרו את הקומפוזיציה, stack מלא במסכים צרים, CTA בגובה 48px, ‏3/3 קישורי WhatsApp, ‏0 overflow, ‏0 תמונות שבורות ו־0 warnings/errors ב־console. `tracker:check`, ‏`design:tokens:check`, ‏`motion:check`, כל 142 הבדיקות, lint, type-check, builds, full `pnpm validate`, ‏`parity:local` ו־`git diff --check` עברו. `UI-008` עברה ל־`VERIFYING` עד push, CI/deploy ואימות Production.
- **Reopened production evidence (2026-07-21):** commit `05d8fc7`, ‏CI `29863387161` ו־Cloudflare deploy `29863387163` עברו. Production ב־1440×1000, ‏768×1024 ו־375×812 אישר את המעבר הזוויתי מה־Hero, כותרת 109/84/58px, שלושה כרטיסים מלאים, כל CTA בגובה 48px לאחר reveal, שלושה קישורי WhatsApp שמורים, ‏0 overflow, ‏0 תמונות שבורות ו־0 warnings/errors ב־console. public, Studio ו־health החזירו `200`; D1 ו־R2 מדווחים `ready`. `UI-008` נסגרה `DONE`.

### Phase 13 — Gallery art direction

#### UI-009 — Turn the gallery into a cinematic contact sheet

- **Status:** `DONE`
- **Dependencies:** `UI-008`, `WEB-003`, `UI-005`.
- **Definition:** לשפר רק את `#gallery` כך שימשיך ישירות את הפרק הקולנועי של ה־Hero והשירותים: רקע ink רציף, כותרת גדולה, video frame מוביל ו־contact sheet אסימטרי לשש התמונות — בלי לשנות את `GallerySection`, סדר ה־DOM, התוכן, המדיה, הפילטרים, lightbox, props, state או לוגיקה.
- **Acceptance criteria:**
  - Desktop מציג כותרת בקנה מידה editorial, מספור `NIS / 03`, video frame מוביל וגריד תמונות אסימטרי ברור; כל שש התמונות נשארות גלויות ב־`הכל` ואין carousel או גלילה פנימית.
  - המעבר מאזור השירותים לגלריה מרגיש רציף באמצעות אותם tokens, פלטה, טיפוגרפיה, קווים ומספור; אין redesign של `#process` או חלק אחר.
  - כל ארבעת מצבי הסינון הקיימים, video controls וה־lightbox נשארים שמישים באמצעות עכבר ומקלדת; focus גלוי ו־touch targets בגובה 44px לפחות.
  - Tablet ו־mobile משתמשים בפריסה קריאה וללא חיתוך; הווידאו אינו sticky במסך צר, כל media נשאר ביחס תקין, ואין overflow אופקי או תוכן שמוסתר בידי ה־sticky CTA.
  - אין שינוי hierarchy, markup, component API, תוכן, media IDs, state או named scroll animations; `prefers-reduced-motion`, lazy loading וה־fallback ללא JavaScript נשארים תקינים.
  - השינוי ממוקד ב־CSS ובבדיקות regression הכרחיות בלבד; אין raw color, selector כפול, dependency חדש, `transition: all` או animation של layout properties.
- **Verification:** `pnpm tracker:check`, ‏`pnpm design:tokens:check`, ‏`pnpm motion:check`, tests/type-check/lint/build/full `pnpm validate`, ‏`parity:local`; בדפדפן ב־1440×1000, ‏768×1024 ו־375×812 עם screenshot/computed checks לכותרת, video, שש תמונות, ארבעה פילטרים, lightbox, keyboard, overflow, media, console ו־reduced-motion; לאחר push — CI/deploy ואימות public/Studio/health בפרודקשן.
- **Evidence (2026-07-22):** ה־tracker, הארכיטקטורה, `GallerySection`, ‏CSS והבדיקות נקראו מחדש. baseline חי ב־1440×1000 אישר video אחד, שש תמונות, ארבעה פילטרים, ‏0 overflow ו־console נקי, אך הסקשן חוזר למשטח בהיר ול־masonry סטנדרטי מיד אחרי השירותים הכהים ולכן אינו ממשיך את אפקט ה־“וואו”. נבחר כיוון “Cinematic Contact Sheet”: רקע ink, כותרת ענקית, video frame, גריד אסימטרי ומספור פרק, תוך שמירת כל החוזים והאינטראקציות. `UI-009` הועברה ל־`IN_PROGRESS` ושער המימוש נפתח ל־`READY`.
- **Local implementation evidence (2026-07-22):** `#gallery` הוסב ב־`theme.css` בלבד לפרק “Cinematic Contact Sheet”: רקע ink רציף, watermark ‏03, כותרת 107/84/58px, מסננים ממוספרים, video frame וגריד אסימטרי לשש תמונות. `GallerySection`, ה־DOM, התוכן, media IDs, state, props, named animations וכל שאר הסקשנים לא השתנו; checker המעקב עודכן במפורש מ־55 ל־56 משימות. בדיקות browser ב־1440×1000, ‏768×1024 ו־375×812 אישרו video אחד, שש תמונות, 6 פילטרים ב־fallback, פילטר `סלטים` עם 3 תוצאות, פתיחת lightbox וסגירה ב־Escape, touch targets בגובה 48px, וידאו לא־sticky במסכים צרים, ‏0 overflow, ‏0 broken media ו־0 console warnings/errors. reduced-motion החזיר opacity ‏1 ו־transform ‏none לכותרת ולתמונה. כל 142 הבדיקות, `tracker:check`, ‏`design:tokens:check`, ‏`motion:check`, lint, type-check, builds, full `pnpm validate`, ‏`parity:local` ו־`git diff --check` עברו. `UI-009` עברה ל־`VERIFYING` עד push, CI/deploy ואימות Production.
- **Production evidence (2026-07-22):** commit `077e86d` עבר CI ‏`29870520582` ו־Cloudflare deploy ‏`29870520800`; deployment ‏`5c5d2769` והדומיין הקנוני מגישים את bundle ‏`index-BjZVQiyV.css`. בדיקות Production ב־1440×1000, ‏768×1024 ו־375×812 אישרו את הכותרת בגודל 107/84/58px, ארבעה פילטרים בגובה 48px, שש תמונות ללא שבר, video לא־sticky ב־tablet/mobile, ‏0 overflow ו־0 console warnings/errors. פילטר `סלטים` הציג את שתי הרשומות החיות המשויכות אליו; lightbox נפתח עם `role=dialog`/`aria-modal` ונסגר ב־Escape. `UI-009` וכל 56 המשימות נסגרו `DONE` ושער המימוש נסגר.

### Phase 14 — Gallery motion refinement

#### UI-010 — Remove gallery video and deepen image-led scroll motion

- **Status:** `VERIFYING`
- **Dependencies:** `UI-009`, `UI-006`.
- **Definition:** להסיר לחלוטין את הווידאו מתוך `#gallery`, להרחיב את שש התמונות לכל רוחב הסקשן ולחזק את חוויית הגלילה באמצעות תנועה אישית לכל frame — בלי לשנות פילטרים, lightbox, תוכן התמונות, API, state או חלק אחר באתר.
- **Acceptance criteria:**
  - אין אלמנט `video`, source, poster, controls או placeholder וידאו בתוך `#gallery`; אין חלל ריק שנשאר במקומו.
  - שש התמונות ממלאות את רוחב הגלריה ב־desktop בגריד editorial אסימטרי, וב־tablet/mobile נשמר סדר קריאה טבעי ללא חיתוך או overflow.
  - לכל תמונה יש scroll-driven journey עצמאי ומורגש המשלב תנועה אנכית/אופקית ועומק באמצעות `transform`/`opacity` בלבד; הכיתוב נחשף בהדרגה לפי כניסת ה־frame למסך.
  - אין scroll hijacking, listener חדש, dependency חדש, אנימציה אינסופית, `transition: all`, animation של layout properties או `will-change` קבוע.
  - `prefers-reduced-motion` מבטל את כל התנועה ומשאיר תמונות וכיתובים גלויים; fallback ללא JavaScript נשאר מלא.
  - ארבעת הפילטרים וה־lightbox נשארים נגישים ופועלים באמצעות עכבר ומקלדת; לא משתנים content/media IDs או לוגיקה עסקית.
- **Verification:** `pnpm tracker:check`, ‏`pnpm design:tokens:check`, ‏`pnpm motion:check`, tests/type-check/lint/build/full `pnpm validate`, ‏`parity:local`; בדפדפן ב־1440×1000, ‏768×1024 ו־375×812: 0 video, שש תמונות, ארבעה פילטרים, lightbox/Escape, overflow/media/console, computed animation timelines בכמה נקודות גלילה ו־reduced-motion; לאחר push — CI/deploy ואימות public/Studio/health/published בפרודקשן.
- **Evidence (2026-07-22):** המשתמש ביקש במפורש להסיר את הסרטון ולהוסיף יותר אנימציית גלילה. הקוד וה־tracker נקראו מחדש: הווידאו נמצא כ־`figure` נפרד ב־`GallerySection`, בעוד שש התמונות כבר משתמשות ב־reveal גנרי וב־parallax משותף המבוסס על timeline של הסקשן כולו. נבחרה קומפוזיציית photo-only עם timeline אנונימי לכל frame, כדי שכל תמונה תגיב למיקומה שלה במסך ולא כולן ינועו יחד. `UI-010` הועברה ל־`IN_PROGRESS` ושער המימוש נפתח ל־`READY`.
- **Local implementation evidence (2026-07-22):** רכיב הווידאו הוסר מ־`GallerySection` והגריד הוגדל ל־12 עמודות עם שש תמונות בלבד; לא נשאר video/source/poster/placeholder ב־DOM. לכל `gallery-item` הוגדר named view timeline מקומי `--gallery-frame`, וה־picture, התמונה והכיתוב צורכים אותו בנפרד באמצעות frame drift דו־כיווני, parallax אנכי ו־caption rise; אין listener, dependency או animation מתמשכת. בדיקות Playwright ב־1440×1000, ‏768×1024 ו־375×812 אישרו 0 video, שש תמונות, 0 overflow, ‏0 broken media, פילטרים בגובה 48px ו־console ללא warnings/errors. מדידה בארבע נקודות גלילה הראתה timeline מתקדם מ־‎-52.75% ל־89.74%, opacity של frame מ־0.46 ל־0.91 וכיתוב מ־0 ל־1; `prefers-reduced-motion` החזיר `animation: none`, ‏opacity ‏1 ו־transform ‏none לכל שלוש השכבות. פילטר `דגים` החזיר שתי תמונות, וה־lightbox נפתח כ־dialog modal ונסגר ב־Escape. כל 142 הבדיקות, `tracker:check`, ‏`design:tokens:check`, ‏`motion:check`, lint, type-check, builds, full `pnpm validate`, ‏`parity:local` ו־`git diff --check` עברו; `UI-010` עברה ל־`VERIFYING` עד push, CI/deploy ואימות Production.

## Open decisions before implementation

| ID | Decision | Status | Blocks |
|---|---|---|---|
| DEC-001 | `Noto Serif Hebrew` לכותרות; body נשאר sans עברי מקומי/מערכתי | Decided | — |
| DEC-002 | Hero: `אירוח שנראה מוקפד ומרגיש ביתי.`; ערכים: הכנה טרייה, הגשה מוכנה, תיאום אישי | Decided | — |
| DEC-003 | שמות השירותים: `אוכל לשבת`, ‏`אירוח קטן`, ‏`מארזים לדרך` | Decided | — |
| DEC-004 | gallery IDs: hosting table, event buffet, salmon lemon, focaccia, mini burgers, caprese, roasted vegetables, dips, table setting; video: `nis-event-table-video.mp4` | Decided | — |
| DEC-005 | FAQ: lead time, delivery, custom menu, preferences; required form: name/phone/service; optional: date/quantity/note | Decided | — |
| DEC-006 | הסטודיו נשאר אפליקציית Pages נפרדת ומקבל Pages Functions same-origin תחת `/api/*` | Decided | — |
| DEC-007 | D1 מחליף Sheets כמקור אמת ו־R2 מחליף Drive למדיה; אין Base64 ב־D1 | Decided | — |
| DEC-008 | Google משמש לזיהוי בלבד; השרת מנפיק session cookie revocable שה־hash שלו ב־D1 | Decided | — |
| DEC-009 | האתר הציבורי נשאר static-first; build צורך published revision ומדיה מ־D1/R2 | Decided | — |
| DEC-010 | תוכן נשמר כ־versioned `ContentSnapshot` אטומי ב־`content_revisions`, validated בחוזה המשותף | Decided | — |
| DEC-011 | session של 8 שעות; revisions נשמרות 90 יום ולפחות 50 אחרונות; media delete grace של 30 יום | Decided | — |
| DEC-012 | published endpoint ציבורי, read-only ו־versioned עם `ETag`; internal metadata אינו נכלל בתגובה | Decided | — |

## Risk register

| ID | Risk | Mitigation | Status |
|---|---|---|---|
| RISK-001 | section שהוסר חוזר דרך managed defaults | schema/defaults/studio/frontend וחוזי regression עודכנו יחד | Closed |
| RISK-002 | local fallback נראה תקין אך production remote content שונה | remote sync, revision parity ו־production DOM אומתו | Closed |
| RISK-003 | אדמין חדש ומימוש public מקביל יוצרים רכיבים כפולים | shared schema/preview ו־QA-005 עם 0 clones/0 cycles | Closed |
| RISK-004 | מעבר Drive→R2 גורם לאובדן מדיה או orphan files | backup, hashes, import dry-run, R2 verification ו־rollback עברו | Closed |
| RISK-005 | גלריה/וידאו פוגעים ב־LCP או CLS | QA-004 אישר LCP משופר, CLS 0 ומדיה lazy/responsive | Closed |
| RISK-006 | כותרות עברית נופלות ל־font לא מכוון | Noto Serif Hebrew ו־network/rendering אומתו | Closed |
| RISK-007 | טופס ארוך עדיין מייצר נטישה | שלושה שדות חובה בלבד ו־mobile flow אומת | Mitigated |
| RISK-008 | העתקת חולשת email bearer או Base64 מיישום הייחוס | session שרתי, R2 streaming ו־negative tests | Closed |
| RISK-009 | שתי מערכות מקור אמת משתנות במקביל בזמן migration | cutover הושלם והחיבורים הישנים הוסרו | Closed |
| RISK-010 | migration D1 נכשל אחרי שינוי schema | migrations versioned, bookmarks, backup ו־rehearsal | Mitigated |
| RISK-011 | publish מסמן revision live אבל dispatch/deploy נכשל | publish jobs, retry idempotent והיסטוריית status | Mitigated |
| RISK-012 | cookie session חשוף ל־CSRF | SameSite, Origin validation, rate limits וללא wildcard CORS | Closed |
| RISK-013 | חריגה ממכסת Cloudflare Free | static assets, rate limits, usage thresholds ו־runbook ב־CF-010 | Monitoring |
| RISK-014 | secrets נחשפים דרך `VITE_*`, logs או error payload | server-only secrets, redaction ו־bundle/log audits | Closed |

### Follow-ups שאינם חוסמי release

- להמשיך ניטור חודשי של D1/R2/Workers מול thresholds של `CF-010`; אין חריגה נוכחית.
- לבחון פיצול render נוסף רק אם מדידות אמיתיות יראו regression; QA-004 לא מצא חסם CWV.
- retention של revisions ומדיה ממשיך לפי runbook; אין פעולת purge אוטומטית במסגרת release זה.

## Progress summary

| Phase | Status | Done | Total |
|---|---|---:|---:|
| Phase 0 — Governance | Done | 4 | 4 |
| Phase 1 — Architecture | Done | 4 | 4 |
| Phase 2 — Design system | Done | 4 | 4 |
| Phase 3 — Public site | Done | 6 | 6 |
| Phase 4 — Cloudflare backend | Done | 10 | 10 |
| Phase 5 — Migration | Done | 6 | 6 |
| Phase 6 — Admin rebuild | Done | 8 | 8 |
| Phase 7 — Quality | Done | 5 | 5 |
| Phase 8 — Release | Done | 4 | 4 |
| Phase 9 — Theme maintainability | Done | 1 | 1 |
| Phase 10 — Scroll storytelling | Done | 1 | 1 |
| Phase 11 — Hero art direction | Done | 1 | 1 |
| Phase 12 — Services art direction | Done | 1 | 1 |
| Phase 13 — Gallery art direction | Done | 1 | 1 |
| Phase 14 — Gallery motion refinement | In progress | 0 | 1 |

## Change Log

### 2026-07-22 — UI-010 gallery motion refinement started

- המשתמש ביקש להסיר לחלוטין את הסרטון מתוך הגלריה ולהפוך את תנועת הגלילה של התמונות למורגשת יותר.
- נבחרה גלריית photo-only ברוחב מלא עם timeline עצמאי לכל frame, תנועת עומק וכיתוב שנחשף בגלילה, ללא scroll hijacking או dependency חדש.
- `UI-010` נוספה כמשימה ה־57 והועברה ל־`IN_PROGRESS`; שער המימוש נפתח ל־`READY`.

### 2026-07-22 — UI-009 cinematic gallery completed

- `#gallery` ממשיך כעת את שפת ה־Hero והשירותים כ־“Cinematic Contact Sheet”: רקע ink, כותרת ענקית, video frame וגריד אסימטרי — ללא שינוי קומפוננטות, DOM, תוכן או לוגיקה.
- commit `077e86d`, ‏CI `29870520582` ו־deploy `29870520800` עברו; bundle החדש ו־Production אומתו ב־desktop/tablet/mobile ללא overflow, מדיה שבורה או שגיאות console, כולל פילטרים ו־lightbox נגיש.
- `UI-009`, ‏Phase 13 וכל 56 המשימות סומנו `DONE`; שער המימוש נסגר.

### 2026-07-22 — UI-009 gallery art direction started

- החלק הבא היחיד שנבחר לשיפור הוא `#gallery`; ה־baseline תקין פונקציונלית אך חוזר למשטח בהיר ול־masonry גנרי שאינם ממשיכים את הדרמה של השירותים.
- הכיוון המאושר הוא “Cinematic Contact Sheet” עם video frame מוביל, גריד אסימטרי ורקע ink רציף, ללא שינוי DOM, תוכן, מדיה או לוגיקה.
- `UI-009` נוספה כמשימה ה־56 והועברה ל־`IN_PROGRESS`; שער המימוש נפתח ל־`READY`.

### 2026-07-21 — UI-008 cinematic continuation completed

- אזור `#experiences` פורסם מחדש כפרק כהה וקולנועי שמתחיל במעבר זוויתי מתוך ה־Hero וממשיך בכותרת ענקית, תמונות דומיננטיות ומספור 01–03.
- commit `05d8fc7`, ‏CI `29863387161` ו־deploy `29863387163` עברו; Production אומת ב־desktop/tablet/mobile ללא overflow, תמונות שבורות או שגיאות console.
- `UI-008` וכל 55 המשימות סומנו `DONE`; שער המימוש נסגר.

### 2026-07-21 — UI-008 reopened after visual review

- משוב המשתמש: הקומפוזיציה הראשונה מקצועית אך אינה ממשיכה את עוצמת ה־Hero ואינה מייצרת “וואו”.
- `UI-008` נפתחה מחדש ל־cinematic dark chapter עם תמונות full-bleed ו־copy משולב, תוך שמירת כל המבנה, התוכן והלוגיקה.
- שער המימוש חזר ל־`READY`; Phase 12 חזרה ל־In progress ללא הגדלת מספר המשימות.

### 2026-07-21 — UI-008 services art direction completed

- אזור `#experiences` פורסם כקומפוזיציית “שולחן בחירה” editorial עם שירות מוביל, שני שירותים משלימים ומספור 01–03; לא שונו התוכן, המדיה, ה־DOM, ה־API או הלוגיקה.
- commit `7e2f38e`, ‏CI `29861024560` ו־deploy `29861024555` עברו; Production אומת ב־desktop/tablet/mobile ללא overflow, תמונות שבורות או שגיאות console.
- `UI-008` סומנה `DONE`, Phase 12 הושלמה, כל 55 המשימות הושלמו ושער המימוש נסגר.

### 2026-07-21 — UI-008 services art direction started

- אזור `#experiences` נבחר כחלק היחיד לשיפור; ה־baseline הוא שלושה כרטיסים גנריים שווי־משקל.
- הכיוון המאושר הוא “שולחן בחירה” editorial אסימטרי שממשיך את ה־Hero, תוך שמירת כל התוכן, המדיה, CTA, ה־DOM והלוגיקה.
- `UI-008` הועברה ל־`IN_PROGRESS`, מספר המשימות עלה ל־55 ושער המימוש נפתח ל־`READY`.

### 2026-07-21 — UI-007 cinematic Hero completed

- הקומפוזיציה ה־editorial, צילום ה־Hero וצילום ה־Trust החדשים פורסמו ואומתו בשלושת ה־breakpoints ללא שינוי hierarchy, פלטה או לוגיקה עסקית.
- commit `e585ec1`, ‏CI `29859294624`, ‏deploy הקוד `29859294534` ו־deploy התוכן `29859479384` עברו; public/Studio/health/published אומתו חיים.
- `UI-007` סומנה `DONE`, Phase 11 הושלמה, כל 54 המשימות הושלמו ושער המימוש נסגר.

### 2026-07-21 — UI-007 cinematic Hero implementation started

- צילום ה־Hero קיים כ־`event-buffet-salad-rolls`; צילום ה־Trust התגלה כחסר והועלה פעם אחת ל־D1/R2 כ־`6cd8987a-d827-4c4f-b965-25edd216b3c5`.
- המימוש מוגבל לקומפוזיציית Hero משותפת ב־`packages/site-preview`, בחירת המדיה דרך ה־Studio ובדיקות מלאות; אין שינוי hierarchy, פלטה, תוכן עסקי או לוגיקה.
- `UI-007` הועברה ל־`IN_PROGRESS` ושער המימוש נפתח ל־`READY`.

### 2026-07-21 — UI-006 scroll storytelling reimplementation completed

- commit המימוש `9d8ce60` ו־commit תיקון fast-scroll `3b240df` נפרסו בהצלחה; CI/deploy הסופיים הם `29787579164`/`29787579149` ו־Cloudflare deployments ‏`373b8509`/`c9ea210f`.
- Production עבר frame-level reveal, scroll-linked Hero/process, fast-scroll ב־desktop/tablet/mobile עם 30/30 visible, interactions, reduced-motion/no-JS המקומיים, ‏0 overflow/broken media/console errors ו־roots/API תקינים.
- `UI-006` סומנה `DONE`, Phase 10 הושלמה, ה־tracker חזר ל־completed ושער המימוש נסגר.

### 2026-07-21 — UI-006 fast-scroll skip fix ready for production

- אימות Production של `9d8ce60` חשף ש־IntersectionObserver לבדו יכול לדלג על element כאשר יחס החיתוך נשאר 0 לפני ואחרי קפיצה גדולה; שלושה פריטים נשארו שקופים בתרחיש הקיצון.
- observer root הורחב כלפי מעלה לאורך המסמך, נוספה בדיקת regression, ושלוש קפיצות local ב־desktop/tablet/mobile הסתיימו עם 30/30 visible. `UI-006` נשארת `VERIFYING` עד פריסה חוזרת.

### 2026-07-21 — UI-006 reimplementation ready for production verification

- תוקן שורש הכשל: transition נשאר פעיל במצב היעד ונמדד frame-by-frame. anonymous timelines שקפאו סביב 50% הוחלפו ב־named section timelines ונמדדו במספר נקודות גלילה.
- נוספה כוריאוגרפיה נפרדת לששת חלקי האתר ללא שינוי hierarchy או לוגיקה: Hero depth, service card/media staging, sticky gallery journey, process progress rail, trust depth ו־contact split entrance.
- ‏141/141 בדיקות וכל שערי `validate`/`parity:local` עברו; שלושה breakpoints, reduced-motion, no-JS, interactions ו־trace עברו. `UI-006` הועברה ל־`VERIFYING` לקראת push ו־Production.

### 2026-07-21 — UI-006 reopened after production motion audit

- בדיקת DevTools מדויקת הוכיחה שה־transition הוגדר רק ב־`.reveal:not(.is-visible)`; ברגע הוספת `is-visible` ה־computed duration הפך מ־`0.52s` ל־`0s`, ללא `CSSTransition` פעיל. בדיקות הסגירה הקודמות אימתו visibility אך לא מדדו תנועה בפועל.
- שני view timelines עבדו, אך בטווח של 24px ו־scale ‏1.02→1.04 בלבד ולכן לא יצרו חוויית גלילה מובחנת. לא הייתה כוריאוגרפיה נרטיבית נפרדת לששת חלקי האתר.
- `UI-006` נפתחה מחדש כ־`IN_PROGRESS`. תנאי הסגירה המחודש מחייב מדידת transitions פעילות, scroll-linked progress במספר רגעי מפתח, כוריאוגרפיה מובחנת לכל section, reduced-motion/no-JS, שלושה breakpoints, interactions, performance, CI/deploy ואימות Production.

### 2026-07-21 — UI-006 scroll storytelling completed

- commit `005b9fa` עבר CI `29784916016` ו־deploy `29784916068`; שני משטחי production וה־health החזירו `200`.
- Production עבר ב־375×812, ‏768×1024 ו־1440×1000 עם 30/30 reveals לאחר walkthrough, שני scroll timelines, ‏0 overflow, ‏0 broken media וללא console errors של האתר; gallery/lightbox/form נשארו תקינים.
- reduced-motion אמיתי ביטל את כל התנועה והציג 30/30 תכנים; Studio login shell נשאר תקין ו־`/api/auth/session` הלא־מאומת החזיר `401` כמצופה. `UI-006` נסגרה `DONE`, Phase 10 הושלמה והשער נסגר.

### 2026-07-21 — UI-006 scroll storytelling started

- dependency audit אישר שאין Framer Motion, Motion, GSAP או AOS; נבחרה הרחבה מקומית של IntersectionObserver + CSS Scroll-Driven progressive enhancement ללא dependency חדש.
- תוכנית השינוי מגינה על hierarchy, תוכן, APIs ולוגיקה קיימים ומשתמשת רק ב־data attributes/classes על nodes קיימים.
- `UI-006` הועברה ל־`IN_PROGRESS`; תנאי הסגירה כוללים reduced-motion, fallback ללא JS, שלושה breakpoints, interaction regression, performance, CI/deploy ו־Production.
- המימוש המקומי הושלם עם hook גנרי, Scroll-Driven progressive enhancement ו־motion gate מורחב; ‏141/141 בדיקות ושלושת ה־breakpoints עברו. reduced-motion אמיתי חשף ותיקן specificity regression, והמשימה הועברה ל־`VERIFYING`.

### 2026-07-21 — UI-005 semantic palette refactor completed

- commit `b3b493e` עבר CI `29760391196` ו־Cloudflare deploy `29760391044`; שני המשטחים החיים אומתו לאחר הפריסה.
- האתר הציבורי מגיש את חוזה `--theme-*` המרכזי, וב־desktop וב־375×812 נמצאו 0 overflow, ‏0 broken media ו־0 console warnings/errors.
- ה־Studio login shell תקין; תגובת session לא־מאומתת נשארה `401` כמצופה. `UI-005` נסגרה `DONE`, Phase 9 הושלמה והשער נסגר מחדש.

### 2026-07-20 — UI-005 semantic palette refactor started

- נפתחה משימת תחזוקה ממוקדת לאחר ה־release: הפלטה הנוכחית נשארת ללא שינוי, אבל כל ערכי הצבע עוברים לחוזה מרכזי שקל להחליף בעתיד.
- baseline: ‏351 literals ב־`base.css`/`theme.css`; הבעלות נשארת ב־`packages/site-preview` המשותף לאתר ול־Studio preview.
- `UI-005` הועברה ל־`IN_PROGRESS`; תנאי הסגירה דורשים zero visual drift, בדיקת contrast, שער אוטומטי, CI/deploy ואימות production.
- הרפקטור המקומי הושלם: 351→0 raw colors ב־styles, חוזה semantic פעיל, build-cache dependency מתוקן, ‏138/138 בדיקות ו־Lighthouse contrast עברו; המשימה ב־`VERIFYING` לקראת פריסה.

### 2026-07-20 — Release completed

- כל 51 המשימות הושלמו; כל תשעת השלבים מסומנים Done.
- release gate, ‏CI/deploy, publish נוסף ו־Production E2E הושלמו מול D1/R2.
- התיעוד, ה־risk register וה־follow-ups נסגרו מול המצב החי; tracker זה נשאר מקור האמת ההיסטורי והאופרטיבי.

### 2026-07-20 — MIG-006 legacy content infrastructure retired

- כל נתיבי runtime/build של מקור התוכן הישן הוסרו; D1/R2 הם מקור האמת היחיד ו־Google נשאר להזדהות בלבד.
- סודות התוכן הישנים וה־feature flag הזמני בוטלו ב־GitHub, בעוד גיבוי ההגירה נשמר לפי מדיניות retention.
- CI/deploy ומחזור publish נוסף בפרודקשן עברו על commit `252e024`; `REL-001` התחילה עם שער release מקומי מלא.

### 2026-07-20 — Tracker bootstrap

- נוצר מקור אמת יחיד לתכנון ולמעקב.
- נקבע מבנה יעד של שישה חלקים לאתר הציבורי.
- נקבע שאין להשתמש בתמונת יהודית כאלמנט אמון מרכזי.
- נוספו כללי no-duplication, strict TypeScript וגבולות monorepo.
- נוספו משימות מדורגות עם acceptance criteria ו־verification.
- שער המימוש סומן `BLOCKED` עד להוספת תכנון מסך האדמין והשמירה ל־Drive.
- המסמך קושר מ־`README.md` כדי שיהיה ניתן לגילוי מכל כניסה לריפו.

### 2026-07-20 — Tracker validation and vault synchronization

- אומתו 31 מזהי משימות ייחודיים ללא כפילויות.
- אומתו 31 מופעי `Definition`, ‏31 מופעי `Acceptance criteria` ו־31 מופעי `Verification`.
- `git diff --check` עבר ללא שגיאות whitespace.
- ישות הפרויקט בכספת עודכנה ב־`overview.md`, ‏`current.md`, ‏`tasks.md` ו־`decisions.md` עם מקור האמת החדש, שער המימוש והחלטות ה־no-duplication.

### 2026-07-20 — Cloudflare server/client architecture and migration plan

- נבדקו המימוש הקיים בפרויקט, מסמך הארכיטקטורה שסופק, קוד הייחוס של פרויקט שוהם ותיעוד Cloudflare הרשמי.
- תועד שהאתר והסטודיו כבר רצים ב־Cloudflare Pages, אך הסטודיו ניגש ישירות ל־Sheets/Drive והפרסום תלוי ב־Apps Script ו־Google service account.
- נקבע יעד: Pages Functions same-origin לסטודיו, D1 לתוכן/אדמינים/sessions/revisions, ‏R2 למדיה והאתר הציבורי נשאר static-first.
- נקבע שלא מעתיקים מיישום הייחוס email bearer לא חתום או upload שמחזיר Base64; ההרשאה תהיה session שרתי והמדיה תוזרם ל־R2.
- נוספו תרשים זרימה, data contract, security model, draft/publish/rollback model, תוכנית cutover ותיעוד מכסות Cloudflare Free.
- `GOV-003` נסגר כ־`DONE`; שער המימוש נשאר `BLOCKED` עד baseline, חוזים ו־readiness review.
- ארבע משימות ה־Data הישנות הוחלפו ב־24 משימות מדויקות: 10 ל־Cloudflare backend, ‏6 ל־migration ו־8 לבניית האדמין; זהו גידול נטו של 20 משימות, ומשימות ה־QA וה־release הותאמו לארכיטקטורה החדשה.

### 2026-07-20 — GOV-002 baseline collected locally and from production

- `GOV-002` עבר ל־`VERIFYING` לאחר צילום production ב־1440/768/375, ספירת 12 sections ובדיקת public/studio.
- נמדדו bundle sizes ו־Lighthouse mobile; קו הבסיס הוא Performance 64 ו־LCP 9.32s.
- `npx pnpm@9.15.9 validate` עבר; public/studio החזירו HTTP 200 ו־security headers תקינים.
- production console נקי משגיאות; נותרה אזהרת preload אחת שתיכנס להשוואת הביצועים.
- commit `3e02bf9` עבר CI run `29704351376` ו־Cloudflare deploy run `29704351375`; בדיקת post-deploy אישרה HTTP 200, ‏12 sections, גרסת תוכן זהה ו־0 שגיאות console.
- `GOV-002` נסגר כ־`DONE`; המשימה הבאה היא `ARC-001`.

### 2026-07-20 — QA-004 performance and media closure

- preload ה־Hero נגזר בזמן build מאותו content contract של ה־UI ותומך גם ב־legacy וגם ב־Cloudflare v2; preload כפול/שגוי הוסר.
- נוספו וריאנט CMS של 960px ו־Hero `sizes` משותף, כך שמובייל טוען בפועל את וריאנט 720px.
- cold Production median LCP ירד מ־9.32s ל־2.843s, ‏CLS נשאר 0.00 ו־INP באינטראקציות mobile/gallery נמדד 65ms.
- תועדו החלטת bundle/TBT, בדיקות media/network, וביטול cache immutable לאחר זיהוי deployment fallback race.
- reveal state נשמר כעת גם לאחר rerender; Production walkthrough הסתיים עם 0 אזורים שקופים, 0 תמונות שבורות ו־0 שגיאות console.
- `QA-004` נסגר כ־`DONE`; המשימה הבאה היא `QA-005`.

### 2026-07-20 — ARC-001 ownership and duplication audit

- `ARC-001` עבר ל־`VERIFYING`; נוספה טבלת ownership לכל capability בין frontend, ‏studio, ‏`site-preview`, ‏`content-schema` ו־Pages Functions.
- אותרו duplicate מדויק של IntroBand ו־near-duplicates של OptimizedImage/media helpers; הוגדר owner יחיד ב־`packages/site-preview`.
- תועדו המונוליתים לפיצול: admin `App.tsx` עם 1,016 שורות ו־`site-preview/MainSections.tsx` עם 919 שורות.
- נקבע שלא ליצור package משותף חדש; החבילות הקיימות מכסות contracts ו־section rendering.
- commit `6e2ba21` עבר CI `29704553125` ו־deploy `29704553137`; שני משטחי production החזירו 200. ‏`ARC-001` נסגר והעבודה עברה ל־`ARC-002`.

### 2026-07-20 — ARC-002 six-section content contract

- `ARC-002` עבר ל־`VERIFYING`; נוסף `publicSiteDocumentSchema` version 2 תחת `packages/content-schema` בלי לשבור את חוזה ה־legacy לפני migration.
- החוזה אוכף שישה sections בלבד, counts עסקיים, IDs/orders ייחודיים והפניות תקינות למדיה מסוג image/video עם R2 object metadata.
- שדות settings/media/section קיימים פעם אחת בלבד; testimonials דורשים `source` מאומת וברירת המחדל שלהם ריקה.
- נוספו חמישה tests ממוקדים; חבילת schema מציגה 14/14 tests וכל `pnpm validate` עבר.

### 2026-07-20 — ARC-003 package boundaries

- `ARC-003` עבר ל־`VERIFYING`; תועדו dependency direction ו־target layout ל־schema, ‏site-preview, ‏frontend, ‏admin ו־Pages Functions.
- נוסף `pnpm architecture:boundaries` שסורק imports וחוסם deep imports, workspace escapes, תלות הפוכה ו־cycles.
- הבדיקה חוברה ל־`pnpm validate`; כל validation עבר.
- commit `74e7f35` עבר CI `29704843089` ו־deploy `29704843111`; שני משטחי production החזירו 200. ‏`ARC-003` נסגר והעבודה עברה ל־`ARC-004`.

### 2026-07-20 — ARC-004 legacy migration and rollback plan

- `ARC-004` עבר ל־`VERIFYING`; נוספה מפת field/group מלאה מה־legacy אל ששת חלקי v2 או archive מפורש.
- נוספו כללי stable IDs, category mapping, archive ללא hard delete, media parity ו־rollback באמצעות revision קודמת.
- נוסף `pnpm migration:plan:audit`; הוא כיסה את שני ה־snapshots, מצא 0 כפילויות/הפניות חסרות, הוכיח rollback מבודד והוכיח שקובצי המקור לא השתנו.
- אין mutation חיצונית בשלב התכנון; `MIG-001` נשאר שער מחייב ל־backup מלא של Sheets/Drive לפני write ראשון.
- commit `eb9c3f5` עבר CI `29705005543` ו־deploy `29705005549`; שני משטחי production החזירו 200. ‏`ARC-004` נסגר והעבודה עברה ל־`GOV-004`.

### 2026-07-20 — GOV-004 implementation readiness review

- כל 51 המשימות נסקרו מול dependency graph, חוזה v2, ownership map, migration/rollback ודרישות production.
- הוכרעו כל החלטות התוכן, הטיפוגרפיה, המדיה, retention וה־published endpoint שחסמו מימוש.
- סדר הביצוע עודכן כך שה־public אינו משכפל שכבות זמניות שיימחקו במעבר ל־D1/R2 והאדמין החדש מתחיל רק לאחר API foundation.
- שער המימוש הועבר ל־`READY`; cutover ו־retirement ממשיכים לדרוש את האישורים המפורשים המוגדרים ב־`MIG-004`/`MIG-006`.
- נוסף `pnpm tracker:check` לשער `validate`; הוא מאמת 51 משימות ייחודיות, מבנה acceptance/evidence מלא, references תקינים, 12 החלטות סגורות ושער `READY`.
- commit `af1e9e8` עבר CI `29705118399` ו־deploy `29705118395`; שני משטחי production החזירו 200. ‏`GOV-004` נסגר והעבודה עברה ל־`UI-001`.

### 2026-07-20 — UI-001 design tokens and Hebrew typography

- `UI-001` עבר ל־`VERIFYING`; נוסף מקור tokens יחיד ב־`packages/site-preview` ונמחקו הגדרות root כפולות בין base/theme.
- כל כותרות `Playfair Display` הועברו ל־`Noto Serif Hebrew`; Assistant נשאר body, עם preconnect, ‏`display=swap` ו־fallback מפורש.
- נוסף `pnpm design:tokens:check` לשער `validate`; הוא בודק שמונה קבוצות tokens, font loading ושמונה זוגות צבעים WCAG AA.
- Playwright ב־1440/375 אישר fonts מחושבים, 0 שגיאות console ו־0 overflow; Lighthouse mobile אישר Accessibility/Best Practices/SEO 100 ו־CLS 0.
- commit `d74897e` עבר CI `29705344793` ו־deploy `29705344824`; production Lighthouse נתן Performance 65, Accessibility 100, LCP 9.2s ו־CLS 0. ‏`UI-001` נסגר והעבודה עברה ל־`UI-002`.

### 2026-07-20 — UI-002 reusable primitives

- `UI-002` עבר ל־`VERIFYING`; נוספה ספריית primitives typed ו־readonly ב־`packages/site-preview`, בלי package חדש.
- הוסרו המימוש הכפול של `OptimizedImage`, העתק ה־SectionHeading ולוגיקת focus trap ייעודית מה־frontend; ה־Dialog וה־image משותפים כעת ל־public ול־preview.
- נוספו Button variants כ־union מפורש, cards, icon item, accordion, form field, dialog, section ו־heading; אין `any` בחבילת ה־preview או באפליקציית public.
- חבילת `site-preview` צורפה לשערי build/lint/test/type-check; 8/8 בדיקות package ו־9/9 בדיקות frontend עברו, כולל keyboard/focus/lightbox.
- commit `5c1b6c4` עבר CI `29705702981` ו־deploy `29705702982`; production smoke אישר dialog keyboard/body-lock ו־0 שגיאות console. ‏`UI-002` נסגר והעבודה עברה ל־`UI-003`.

### 2026-07-20 — UI-003 navigation and conversion surfaces

- `UI-003` עבר ל־`VERIFYING`; הניווט הראשי צומצם לארבעה יעדים בלבד ו־FAQ נשאר בתוך מסלול ההמרה.
- נוסף mobile menu נגיש עם aria state, סגירה בבחירה/Escape והחזרת focus; CTA התחתון מכבד safe-area.
- 11/11 בדיקות frontend עברו; Playwright ב־375/1440 אישר direct anchor, תפריט פתוח/סגור, visibility נכונה ו־0 overflow/errors.
- commit `d7198fa` עבר CI `29705909705` ו־deploy `29705909716`; production אישר את ארבעת העוגנים, direct `#gallery`, סגירת Escape עם החזרת focus, ‏0 overflow/errors ו־HTTP 200 בשני המשטחים. `UI-003` נסגר והעבודה עברה ל־`UI-004`.

### 2026-07-20 — UI-004 motion and interaction states

- `UI-004` עבר ל־`VERIFYING`; הוסרו כל האנימציות המתמשכות, כולל CTA, floating notes ו־moving rails.
- כל transitions שנותרו משתמשים ב־tokens של 180/240/280ms; אנימציות inset/padding/gap הוחלפו ב־transform או state ללא reflow.
- נוספו מצבי pressed/focus/disabled/loading/success/error משותפים ו־9/9 בדיקות primitives עברו.
- נוסף `pnpm motion:check` לשער `validate`; validation מלא עבר. Playwright לוקאלי אישר reduced-motion עם תוכן גלוי, 0 infinite animations, ‏0 overflow/errors ו־layout יציב ל־CTA.
- commit `c6221bf` עבר CI `29706365006` ו־deploy `29706364983`; production אישר את כל 40 רכיבי reveal גלויים ב־reduced-motion, ‏0 active/infinite animations, ‏0 overflow/errors ו־HTTP 200. `UI-004` נסגר, Phase 2 הושלם והעבודה עברה ל־`WEB-001`.

### 2026-07-20 — WEB-001 unified Hero

- `WEB-001` עבר ל־`VERIFYING`; Hero/Intro/Manifesto/Audience הוחלפו ב־Hero יחיד, והוסרו מימוש Hero כפול ו־legacy component exports.
- `publicHeroDefaults` בחוזה המשותף הוא ברירת המחדל היחידה לכותרת, תיאור, CTA ושלוש נקודות הערך המאושרות; שורות legacy אינן יכולות להחזיר את הקומפוזיציה הישנה.
- ה־Hero כולל תמונה responsive אחת עם dimensions, שני CTA ושלושה ערכים בלבד; אין וידאו, collage, stats או notes.
- 15/15 בדיקות schema, ‏9/9 preview ו־11/11 frontend עברו; validation מלא עבר. Playwright בארבעה breakpoints אישר סדר responsive, ‏0 overflow/errors ו־CLS 0 ב־375px.
- commit `916e806` עבר CI `29706759177` ו־deploy `29706759207`; בדיקת production חשפה alt ספציפי שלא תאם את תמונת ה־Sheets המרוחקת.
- commit מתקן `8b45c5e` עבר CI `29706860904` ו־deploy `29706860944`; production אישר alt מדויק, copy/CTA, ‏0 legacy/video/overflow/errors ו־CLS 0. `WEB-001` נסגר והעבודה עברה ל־`WEB-002`.

### 2026-07-20 — WEB-002 services

- `WEB-002` עבר ל־`VERIFYING`; שלושת השירותים משתמשים ב־`publicServicesDefaults` משותף לשמות, לסדר ולהקשר ה־CTA, בלי לשכפל schema או section.
- מימושי השירותים הישנים הוסרו; `ServicesSection` ו־`ServiceCard` המשותפים מציגים media, copy, התאמה ו־CTA, ומצב חסר מפורש אם המקור אינו מכיל בדיוק שלושה שירותים.
- 16/16 בדיקות schema, ‏11/11 בדיקות `site-preview`, ‏11/11 בדיקות frontend ו־`pnpm validate` עברו.
- Playwright לוקאלי ב־375/1440 אישר שלושה כרטיסים בסדר המאושר, URLs תלויי־שירות, פריסה responsive, ‏0 כפילות/overflow/errors וצילומי מסך חזותיים תקינים.
- commit `54eff13` עבר CI `29707226525` ו־deploy `29707226533`; production עם asset העדכני אישר 3 כרטיסים/תמונות, שמות/סדר/URLs, פריסת 375/1440, ‏0 tablist/overflow/errors ו־HTTP 200 בשני המשטחים. `WEB-002` נסגר; `WEB-003` נשאר תלוי ב־`CF-007`, ולכן העבודה עברה למשימה העצמאית הבאה `WEB-004`.

### 2026-07-20 — WEB-004 process

- `WEB-004` עבר ל־`VERIFYING`; `publicProcessDefaults` מרכז את ארבעת השלבים ואת שלוש ההערות התפעוליות המאושרות, בלי לשכפל את חוזה התוכן.
- `ProcessSection` ייעודי החליף את שני ה־sections הישנים process/coordination; אותו markup מוצג כשורה מחוברת בדסקטופ וכ־timeline אנכי במובייל, עם מצב חסר מפורש למקור חלקי.
- 17/17 בדיקות schema, ‏13/13 בדיקות `site-preview`, ‏11/11 בדיקות frontend ו־`pnpm validate` עברו.
- Playwright לוקאלי ב־375/1440 אישר 4 שלבים/3 הערות, section יחיד, סדר ופריסה נכונים, ‏0 copy ישן/overflow/errors ובדיקה חזותית תקינה.
- commit `e49d915` עבר CI `29707490546` ו־deploy `29707490510`; production אישר את אותו תוכן ו־layout ב־375/1440, ‏0 coordination כפול/overflow/errors ו־HTTP 200 בשני המשטחים. `WEB-004` נסגר והעבודה עברה ל־`WEB-005`.

### 2026-07-20 — WEB-005 trust

- `WEB-005` עבר ל־`VERIFYING`; `publicTrustDefaults` מרכז בדיוק שלוש נקודות מאושרות, media reference ורשימת testimonials ריקה.
- `TrustSection` יחיד החליף את ה־story הביוגרפי ואת trust הישן; אין תמונת בעלים, אזכור יהודית, copy ביוגרפי או המלצה ללא מקור.
- 18/18 בדיקות schema, ‏15/15 בדיקות `site-preview`, ‏11/11 בדיקות frontend ו־`pnpm validate` עברו.
- Playwright לוקאלי ב־375/1440 אישר שלוש נקודות ותמונת אוכל אחת, פריסת טור/שתי עמודות, ‏0 owner/story/testimonials/overflow/errors ובדיקה חזותית תקינה.
- commit `88d939d` עבר CI `29707679675` ו־deploy `29707679717`; לאחר חלון propagation קצר asset ה־JS אומת כתקין ובדפדפן נקי production אישר את אותו תוכן/פריסה, ‏0 owner/story/testimonials/overflow/errors ו־HTTP 200 בשני המשטחים. `WEB-005` נסגר והעבודה עברה ל־`WEB-006`.

### 2026-07-20 — WEB-006 FAQ and contact conversion

- `WEB-006` עבר ל־`VERIFYING`; ארבע שאלות ו־CTA אחד מגיעים מ־`publicContactDefaults`, ו־`ContactSection` יחיד מחליף את שני ה־sections הישנים.
- הטופס צומצם לשם/טלפון/סוג הזמנה כחובה ולתאריך/כמות/הערה כאופציונליים; validation משותף מציג שגיאות inline, מקשר אותן לשדות ומעביר focus לשגיאה הראשונה.
- 19/19 בדיקות schema, ‏18/18 בדיקות `site-preview`, ‏11/11 בדיקות frontend ו־`pnpm validate` עברו; valid flow מאשר URL WhatsApp מקודד ו־invalid flow מאשר focus/errors.
- Playwright לוקאלי ב־375/1440 אישר 4 FAQ/6 fields, accordion נגיש, input modes למובייל, טור/שתי עמודות, ‏0 כפילות/overflow/errors ובדיקה חזותית תקינה.
- commit `edba315` עבר CI `29707932127` ו־deploy `29707932147`; production אישר invalid flow עם שלוש שגיאות ו־focus ראשון, 4 FAQ/6 fields, layout responsive, ‏0 כפילות/overflow/errors ו־HTTP 200 בשני המשטחים. `WEB-006` נסגר; `WEB-003` נשאר תלוי ב־`CF-007`, ולכן העבודה עברה ל־`CF-001`.

### 2026-07-20 — CF-001 resource provisioning started

- חשבון Cloudflare אומת ב־Wrangler עם הרשאות D1/Pages, ונוצרו `nis-content-preview` ו־`nis-content-production` כמשאבים נפרדים באזור EEUR.
- בדיקת R2 נעצרה עם API code `10042`: R2 טרם הופעל בחשבון ודורש subscription/checkout דרך ה־Dashboard.
- לא נוסף config חלקי ולא בוצע deploy של bindings חסרים. `CF-001` נשאר `IN_PROGRESS` עד אישור אנושי להפעלת R2, יצירת שני buckets, חיבור `DB`/`MEDIA` ואימות local/preview/production.

### 2026-07-20 — CF-001 R2 checkout authorized

- התקבל אישור אנושי מפורש להפעיל R2 וה־Dashboard התקדם למסך `Activate R2` עם אמצעי התשלום הקיים.
- Cloudflare מציג `$0/month` כבסיס ומחייב כתובת חיוב, אישור תנאי השירות ואישור חיוב רק במקרה של חריגה מהמכסה החינמית.
- המסך הושאר פתוח להשלמת כתובת החיוב והאישורים על ידי בעל החשבון; לא הוזנו פרטים אישיים ולא הופעל R2 עדיין.

### 2026-07-20 — CF-001 resources and preview verification

- R2 הופעל ושני buckets פרטיים נוצרו: `nis-media-preview` ו־`nis-media-production`; שני מאגרי D1 הקיימים נשארו מופרדים לפי environment.
- נוסף `wrangler.toml` מבוסס על ה־Pages config שהורד מה־Dashboard, עם `DB`/`MEDIA` ל־local, ‏preview ו־production, ונוצרו binding types דרך Wrangler.
- נוסף `/api/health` קטן וקבוע לצורך binding smoke ולבסיס משימת `CF-003`; הוא אינו חושף IDs או secrets.
- local Pages dev וה־preview deployment `c1094efc` החזירו `200` עם `database: ready`, ‏`media: ready`, ‏`status: ok`; `CF-001` עברה ל־`VERIFYING` עד deploy ואימות production.

### 2026-07-20 — CF-001 production verification

- commit `75ae97c` עבר CI `29719259191` ו־Cloudflare deploy `29719259237` בהצלחה.
- `https://studio.nisboutiquecatering.com/api/health` החזיר `200` עם `database: ready`, ‏`media: ready`, ‏`status: ok`; גם ה־studio root והאתר הציבורי החזירו `200`.
- Pages config שהורד מחדש לאחר הפריסה אישר `DB`/`MEDIA` של Preview מול `nis-content-preview`/`nis-media-preview` ושל Production מול `nis-content-production`/`nis-media-production`; `CF-001` נסגרה כ־`DONE`.

### 2026-07-20 — CF-002 migrations started

- `CF-002` עברה ל־`IN_PROGRESS` לאחר ש־`CF-001` וכל תלויותיה נסגרו.
- נקודת הפתיחה: שני מאגרי D1 ריקים; אין migrations או runtime schema creation קיימים. היעד הוא migration versioned יחיד ל־schema הראשוני ו־bootstrap admin דרך כלי server-side בלבד.

### 2026-07-20 — CF-002 local and preview verification

- נוסף migration ראשוני versioned עם חמש הטבלאות המאושרות, constraints, foreign keys ואינדקסים; אין `CREATE TABLE` ב־runtime.
- local apply על state ריק עבר ב־16 statements, apply חוזר לא מצא migrations; schema inspection ו־`PRAGMA foreign_key_check` עברו.
- בוצע rollback rehearsal מ־SQLite backup מקומי: לאחר migration טבלת `admins` הייתה קיימת, ושחזור ה־backup החזיר את marker הישן ללא טבלת `admins`.
- כלי bootstrap server-side נבדק פעמיים והשאיר admin פעיל יחיד. אותו migration וה־seed הוחלו על Preview remote; נמצאו migration אחד, admin פעיל אחד ו־0 הפרות foreign key.
- `CF-002` עברה ל־`VERIFYING` עד validation, deploy והחלה מבוקרת על Production עם Time Travel bookmark.

### 2026-07-20 — CF-002 production migration

- commit `58a611a` עבר CI `29719632920` ו־Cloudflare deploy `29719632890`; לפני שינוי Production נשמר Time Travel bookmark `00000002-00000000-000050ae-d8bd4822629525ba61881ef35e4c36ab`.
- migration הוחל על `nis-content-production`, כלי ה־bootstrap הוסיף admin פעיל יחיד, ו־apply חוזר החזיר `No migrations to apply`.
- inspection אישר חמש טבלאות domain, ‏migration אחד, admin פעיל אחד ו־0 foreign-key violations; production health וה־public/studio roots החזירו `200`. `CF-002` נסגרה כ־`DONE`.

### 2026-07-20 — CF-003 API foundation started

- `CF-003` עברה ל־`IN_PROGRESS`; התלויות `CF-001` ו־`ARC-003` סגורות.
- נקודת הפתיחה היא health handler יחיד שנוסף ב־`CF-001`; הוא יועבר ל־domain route וייכנס דרך entry/router קטן עם request IDs, error envelope ו־shared Zod validation.

### 2026-07-20 — CF-003 local API verification

- health handler הועבר ל־domain route, ונוסף wildcard Pages entry דק שמאציל ל־router משותף במקום handlers מונוליתיים.
- שכבת HTTP יחידה מרכזת route contracts, ‏request IDs קריפטוגרפיים, security headers, error envelopes ו־Zod parsing; אין `any`, ‏Env ידני או wildcard CORS.
- 21/21 בדיקות הסטודיו, type-check ולינט עברו; local Wrangler integration אישר `200/404/405`, ‏`Allow`, ‏`X-Request-ID`, security headers ו־health מוכן עבור D1/R2.
- full `pnpm validate` עבר; Preview deployment `c4b57d3e` אישר שוב `200/404/405`, ‏error envelopes, ‏`Allow`, ‏request IDs/security headers, ללא wildcard CORS, ו־D1/R2 במצב ready.
- commit `fb936b6` עבר CI `29720183240` ו־Cloudflare deploy `29720183269`.
- Production אישר health `200` עם D1/R2 ready, ‏missing `404`, ‏method `405`, ‏Allow/request IDs/security headers וללא wildcard CORS; public/studio roots החזירו `200`. `CF-003` נסגרה כ־`DONE`.

### 2026-07-20 — CF-004 server identity and session foundation

- `CF-004` עברה ל־`IN_PROGRESS` לאחר סגירת תלויות D1/API; אימות והרשאה נשארים בצד השרת ולא ב־React.
- נוספו אימות Google ID token חתום מול JWKS ו־RS256, קישור subject למנהל פעיל, token session אקראי של 256-bit עם SHA-256 בלבד ב־D1, ו־cookie מוקשח מסוג `__Host-`.
- נוספו routes לכניסה, בדיקת session ויציאה; session lookup בודק expiry, revocation וסטטוס admin בכל בקשה.
- 29/29 בדיקות סטודיו, type-check ולינט עברו. Wrangler local אישר `401` ללא session/לטוקן מזויף ו־logout idempotent עם cookie מחיקה, request ID ו־security headers.
- בדיקת Preview ראשונה חשפה ש־Pages Functions לא ירשו את Client ID מה־build environment; ה־Client ID הציבורי הוגדר לכן במפורש בכל environments של Wrangler וה־binding types נוצרו מחדש.
- Preview deployment `7b61f2ba` אישר token מזויף `401` במקום fail-closed של config, ‏session חסר `401`, ‏logout `200` עם cookie מחיקה, ו־0 sessions ב־D1 לאחר הניסיונות השליליים.
- commit `09d5e62` עבר CI `29720818114` ו־Cloudflare deploy `29720818107`; deployment `e0fd5f3b` הוא Production על commit זה.
- לאחר propagation, Production אישר session חסר `401`, token מזויף `401`, logout `200` עם cookie מחיקה מוקשח, request IDs/security headers וללא session שנוצר ב־D1; health ושני ה־roots החזירו `200`. `CF-004` נסגרה כ־`DONE`.

### 2026-07-20 — CF-005 centralized API security started

- `CF-005` עברה ל־`IN_PROGRESS`; router יחיד מפעיל כעת policy typed לפני handler, ללא הרשאה ב־React או checks מפוזרים.
- נוספו presets משותפים ל־admin read/mutation, ‏login, logout, upload ו־publish עם session, same-origin, content-type/body limits ו־rate limits לפי הצורך.
- migration ‏`0002_api_rate_limits.sql` מוסיף counters ב־D1 לפי hash בלבד. local ו־Preview apply עברו, apply חוזר היה no-op, וב־Preview קיימות שתי migrations.
- 35/35 בדיקות סטודיו עברו; Wrangler local אישר matrix ‏`401/403/413/415/429`, ‏`Retry-After`, request IDs/security headers וללא wildcard CORS.
- full `pnpm validate` ו־audit לחיפוש bearer/CORS/allowlist client-side עברו.
- Preview deployment `03751190` אישר `401/403/413/415`; עשר בקשות login שגויות נספרו וקריאה 11 מול כתובת ה־deployment הקבועה החזירה `429` עם `Retry-After`. המפתח ב־D1 הוא hash באורך 64 ולא IP גלוי.
- commit `3173e7b` עבר CI `29721372197` ו־Cloudflare deploy `29721372190`; Production deployment `c8332f56` מצביע ל־commit זה.
- לפני migration Production נשמר Time Travel bookmark `00000005-00000000-000050ae-f775ab4d77178760cc2f25e4f9e23027`; apply עבר, apply חוזר היה no-op, נמצאו שתי migrations ו־0 foreign-key violations.
- Production אישר `401/403/413/415`, ספירת login ב־D1 כמפתח hash באורך 64, request IDs/security headers ו־health/public/studio `200`. ‏`429` לא הופעל בכוונה על IP המנהל ב־Production לאחר שאומת במלואו ב־unit/local/Preview. `CF-005` נסגרה כ־`DONE`.

### 2026-07-20 — CF-006 draft revision API

- `CF-006` עברה ל־`IN_PROGRESS` לאחר סגירת security middleware; ה־API משתמש בחוזה v2 היחיד מ־`content-schema` ולא ב־legacy schema.
- נוספו repository ו־routes לקריאת ושמירת draft מלא, עם optimistic version, ‏created/updated audit, schema validation בכל read/write ו־`409` לשמירה stale.
- migration ‏`0003_draft_revision_audit.sql` מוסיף `updated_by`, backfill, audit index ו־unique draft. local ו־Preview apply עברו, apply חוזר היה no-op ו־0 FK violations.
- 40/40 בדיקות סטודיו עברו. Wrangler local אישר authenticated read ו־`401/403/400`; Preview deployment `94a0b917` אישר save→reload, update ‏1→2, ‏`409` concurrent ו־`400` invalid מול D1 אמיתי.
- רשומת ה־draft וה־session הזמניות שנוצרו ב־Preview נמחקו במדויק לאחר הבדיקה; published לא השתנה. full `pnpm validate` עבר. `CF-006` עברה ל־`VERIFYING` עד push/CI, migration Production ואימות Production.
- commit `3064caf` עבר CI `29722058410` ו־Cloudflare deploy `29722058384`; Production deployment `e283b557` מצביע ל־commit זה.
- לפני migration Production נשמר Time Travel bookmark `00000007-00000000-000050ae-2add70c7ecf88430169746d6327a8c50`; apply וחזרה no-op עברו, עם שלוש migrations ו־0 FK violations.
- Production אישר `401` לקריאה/כתיבה לא מאומתת, `403` ל־Origin חסר, request IDs/security headers ו־0 content rows; לא נוצרה טיוטה לפני שלב ההגירה. health ושני ה־roots החזירו `200`. `CF-006` נסגרה כ־`DONE`.

### 2026-07-20 — CF-007 R2 media lifecycle

- `CF-007` עברה ל־`IN_PROGRESS`; נוסף media domain יחיד ל־upload/list/metadata/archive/restore/orphan scan, וכל route משתמש ב־security presets הקיימים.
- upload הוא raw stream ישירות ל־R2 עם Content-Length, ‏12MB limit, MIME allowlist, server key ו־R2 SHA-256 validation; D1 מקבל metadata בלבד ואין Base64.
- archive הוא soft-delete וחסום ב־`409` כאשר draft/published תקין מפנה ל־media ID; physical delete אינו חשוף ב־API. restore ועדכון alt אטומיים ב־D1.
- 41/41 בדיקות סטודיו ו־full validation עברו. Local ו־Preview `974ccb84` אישרו upload אמיתי, duplicate, invalid type, oversize, list, update, archive/restore, referenced delete ו־orphan scan ריק.
- כל test object/row/session/draft נמחקו במדויק מ־local ומ־Preview; Preview חזר ל־0 media/content rows. `CF-007` עברה ל־`VERIFYING` עד push/CI/deploy ואימות Production של המשטח השלילי/read-only.
- commit `986829e` עבר CI `29722739332` ו־Cloudflare deploy `29722739333`; Production deployment `b578a7c7` מצביע ל־commit זה.
- Production אישר `401` ל־media/orphan reads ללא session, ‏`403` ל־mutation ללא Origin, ‏0 media/content rows ו־health/public/studio `200`. `CF-007` נסגרה כ־`DONE`.

### 2026-07-20 — CF-008 atomic publish and rollback

- `CF-008` עברה ל־`IN_PROGRESS`; נוספו publish/rollback/history domains נפרדים, idempotency ואימות מחודש של revision ומדיית R2.
- migration ‏`0004_publish_job_audit.sql` מוסיף operation ו־source revision ל־audit; local ו־Preview apply וחזרה no-op עברו עם 0 FK violations.
- ‏44/44 בדיקות סטודיו ו־full validation עברו. Local ו־Preview `3927f9fb` אישרו publish, duplicate, dispatch failure/retry, publish נוסף, rollback ו־audit; missing R2 object נחסם ב־`409`.
- כל נתוני הבדיקה נמחקו במדויק ו־Preview orphan scan חזר ריק. dispatch אמיתי יצר workflow run `29723670205`, וסוד GitHub נשמר מוצפן ב־Pages Production בלבד. `CF-008` עברה ל־`VERIFYING` עד push/CI/deploy ו־Production migration/negative checks.
- commit `25a2f4b` עבר CI `29723812878` ו־deploy `29723812837`; Production deployment `d8307825` מצביע ל־commit זה.
- לפני migration Production נשמר bookmark `0000000a-00000000-000050ae-a93685f1e0f52e19a6f7436869e7ce2c`; apply וחזרה no-op עברו עם 4 migrations ו־0 FK violations.
- Production אישר `401/403`, ‏0 jobs/revisions/media, secret מוצפן ו־health/public/studio `200`. `CF-008` נסגרה כ־`DONE`.

### 2026-07-20 — CF-009 D1/R2 build sync

- `CF-009` עברה ל־`IN_PROGRESS`; נוספו published snapshot/media endpoints ו־reference helper יחיד המשותף ל־schema, archive guard ו־build.
- נוסף Cloudflare sync ללא service account או fallback סמוי, עם SHA/bytes verification, referenced-only downloads, WebP/variants, exact v2 snapshot ו־compatibility adapter לאתר הסטטי.
- Preview `488d7cb3` ו־clean CI-like workspace אישרו 10 references, ‏50 generated media files, exact SHA `269ec5f5…`, content/media checks ו־build. missing object גרם לכשל `404` ושוחזר בהצלחה.
- workflow כולל Cloudflare lane הנשלט ב־`PUBLIC_CONTENT_SOURCE`; legacy lane נשאר פעיל רק עד cutover `MIG-005` כדי לא לבנות מ־Production D1 הריק. כל נתוני Preview נמחקו. `CF-009` עברה ל־`VERIFYING` עד push/CI/deploy ו־Production checks.
- commit `68e6d9b` עבר CI `29724776801` ו־deploy `29724776832`; Production deployment `04a43bb6` מצביע אליו.
- Production החזיר `404 published_content_not_found` כמצופה לפני import, נשאר עם 0 jobs/revisions/media ו־0 FK violations, ו־health/public/studio החזירו `200`. `CF-009` נסגרה כ־`DONE`.

### 2026-07-20 — MIG-002 deterministic transformer

- `MIG-002` עברה ל־`VERIFYING`; transformer typed ממיר את הגיבוי immutable למסמך v2, ‏R2 manifest ורשימת archive בלי schema כפול.
- 16 media IDs ומקורות Drive מופו למפתחות R2 יציבים; 6 פריטי gallery, ‏100 sections ושני קובצי Drive הופרדו במפורש מהתוכן הפעיל.
- שלוש בדיקות fixture, ‏schema validation, שתי הרצות byte-identical ו־full `pnpm validate` עברו. התוצרים הקנוניים וה־SHA-256 שלהם נשמרו תחת `migration/legacy-google/20260720T080523Z` לקראת import ל־Preview.
- commit `4e066b6` עבר CI `29727541218` ו־deploy `29727541187`; Production smoke אישר `200` בשני ה־roots וב־health עם D1/R2 ready. `MIG-002` נסגרה כ־`DONE` ו־`MIG-003` החלה מול Preview בלבד.

### 2026-07-20 — MIG-003 Preview import and parity

- נוסף importer write-gated ל־Preview עם preflight, source verification, ‏D1 upsert, ‏R2 upload/download verification ודוח parity קנוני.
- שתי הרצות מלאות השאירו draft/published יחידים ו־16 assets/objects ללא duplicate, missing, orphan או FK violation; כל session בדיקה נמחק.
- deployment ‏`2c1d0682` אישר את מסלולי ה־API המאומתים והציבוריים, ו־clean Cloudflare sync/build עבר מול published Preview. Production נשאר ריק וללא שינוי. `MIG-003` עברה ל־`VERIFYING` עד push/CI/deploy ו־Production smoke.
- commit `a16b747` עבר CI `29728841864` ו־deploy `29728841874`; Production smoke אישר `200` בשני ה־roots וב־health וה־D1 production נשאר ריק. `MIG-003` נסגרה כ־`DONE`; לפי dependency order, `ADM-001` החלה לפני cutover.

### 2026-07-20 — ADM-001 admin ownership split

- `App.tsx` הומר ל־composition root של 3 שורות; ה־legacy migration feature, ‏login gate, navigation ו־generic primitives קיבלו ownership וקבצים מפורשים ללא duplication.
- כל 46 בדיקות הסטודיו, full validation ושני builds עברו; browser local אישר את login shell ללא console errors. `ADM-001` עברה ל־`VERIFYING` עד push/CI/deploy ו־Production smoke.
- commit `811323d` עבר CI `29729384252` ו־deploy `29729384250`; Production browser אישר את login shell ללא console errors, ושני ה־roots וה־health החזירו `200`. `ADM-001` נסגרה כ־`DONE` ו־`ADM-002` החלה.

### 2026-07-20 — ADM-002 server session UX

- הוסרו Google Sheets/Drive OAuth scopes, ‏Picker, access-token lifecycle ו־browser storage; Google נשאר ID credential חד־פעמי בלבד.
- נוסף auth client typed ו־server-session hook ל־restore/expiry/logout, ו־CSP צומצם ל־Google Identity. Wrangler local browser אישר refresh ו־logout עם revoke ב־D1.
- ‏42/42 בדיקות סטודיו ו־full validation עברו; `ADM-002` עברה ל־`VERIFYING` עד push/CI/deploy ו־Production verification.
- commit `ea58359` עבר CI `29730112539` ו־deploy `29730112487`; Production אישר Google Identity תחת CSP המצומצם ו־session→logout→revoke אמיתי, ולאחר cleanup נשאר עם 0 sessions ו־0 FK violations. `ADM-002` נסגרה כ־`DONE` ו־`ADM-003` החלה.

### 2026-07-20 — ADM-003 typed API client and query state

- auth client הנפרד אוחד ל־transport typed יחיד עם same-origin credentials, ‏Zod parsing, cancellation, error taxonomy ו־retry מוגבל ל־GET בלבד; אין `fetch` ישיר ב־features או ב־hooks.
- נוסף `studioApi` מרכזי ל־auth/content/media ו־query-state hook גנרי; session shell טוען draft מאומת דרך אותה שכבה ומטפל ב־401 דרך owner יחיד של ה־session.
- ‏46/46 בדיקות סטודיו ו־full `pnpm validate` עברו, כולל failure matrix ל־retry, mutation conflict, network, cancellation ו־invalid response. `ADM-003` עברה ל־`VERIFYING` עד push, CI/deploy ואימות Preview/Production.
- commit `f4ae5b3` עבר CI `29730800883` ו־deploy `29730800772`; Preview deployment `15c79235` טען דרך browser את draft גרסה 1, logout ביטל את ה־session וה־cleanup חזר ל־0 sessions/FK violations. Production deployment `563e2c65` אישר login gate, bundle חדש, roots/health `200` ו־D1 נקי. `ADM-003` נסגרה כ־`DONE` ו־`ADM-004` החלה.

### 2026-07-20 — ADM-004 six-section editing and preview

- נוסף editor data-driven יחיד לששת חלקי v2, עם controls גנריים, dirty/unload guard, ‏field-level Zod errors ו־optimistic conflict handling בלי שכפול טפסים או handlers.
- נוסף `PublicSiteDocumentPreview` משותף ב־`packages/site-preview`; האדמין מעביר אליו את אותו `PublicSiteDocument` ומקבל preview חי לכל ששת החלקים בלי להעתיק markup.
- ‏8 בדיקות רכיב מכסות load→edit→validate→save→reload לכל חלק, invalid field ו־conflict; ‏54/54 בדיקות סטודיו ו־full validation עברו. Browser מקומי אישר שינוי Hero חי, save גרסה 1→2 ו־reload; local D1 נוקה לאחר הבדיקה. `ADM-004` עברה ל־`VERIFYING` עד push, CI/deploy ואימות Preview/Production.
- commit `6eb0546` עבר CI `29732124343` ו־deploy `29732124329`; Preview deployment `c0212f95` אישר media/save/reload/logout ב־`200`, ולאחר restore נשאר עם טיוטה מקורית גרסה 1, ‏16 media ו־0 sessions/FK violations. Production deployment `5acccdab` אישר authenticated empty-draft/logout ונשאר נקי. `ADM-004` נסגרה כ־`DONE` ו־`ADM-005` החלה.
- בבדיקת dependencies לפני מימוש `ADM-005` נמצא כי `WEB-003` עדיין פתוחה והיא dependency מפורשת. כדי שה־media picker ישתמש באותו gallery/media model ולא ייצור surface מקביל, `ADM-005` הוחזרה ל־`BACKLOG` ו־`WEB-003` עברה ל־`IN_PROGRESS`; לאחר סגירתה חוזרים מיד ל־`ADM-005`.

### 2026-07-20 — WEB-003 integrated gallery implementation

- הגלריה ו־real media אוחדו ל־`GallerySection` משותף אחד עם 6 תמונות ראשוניות, סרטון יחיד ומסננים הנגזרים מהמדיה הזמינה; הוסרו component, markup, labels ו־CSS כפולים.
- נשמרה שרשרת המדיה הקיימת עם variants, מידות ו־lazy loading; נוספו video poster/metadata ופריסה responsive אחת ללא שכפול DOM.
- ‏20/20 בדיקות `site-preview`, ‏14/14 בדיקות frontend ו־full validation עברו. Chrome מקומי אישר keyboard/focus, media ‏200/206, ‏0 broken assets/errors/overflow ו־CLS ‏0.0058. `WEB-003` עברה ל־`VERIFYING` עד push, CI/deploy ואימות production.
- commit `d64fc32` עבר CI `29733285325` ו־deploy `29733285346`; Production בדפדפן נקי אישר את גלריית המדיה המלאה, keyboard/focus, כל ה־assets ב־`200/206` ושני המשטחים/health ב־`200`. `WEB-003` נסגרה כ־`DONE` ו־`ADM-005` החלה.

### 2026-07-20 — ADM-005 R2 media library

- נוסף picker/library יחיד ל־Hero, ‏Services ו־Gallery עם upload progress/retry, תצוגת R2 מאומתת, alt/poster, reference counts, replace, archive ו־restore; אין Base64 או picker מקביל.
- endpoint מאומת חדש מציג media של טיוטה ישירות מ־R2, ו־D1 reference guard נשאר הסמכות הסופית. נתמכים גם IDs הקריאים של migration וגם UUID של העלאות חדשות.
- ‏59/59 בדיקות סטודיו ו־full validation עברו. בדיקת Wrangler/Chrome מקומית השלימה upload→preview→replace→save→reload, duplicate ‏409, alt edit, archive/restore, mobile/keyboard ו־orphan scan ריק; כל נתוני הבדיקה נוקו. `ADM-005` עברה ל־`VERIFYING` עד push, CI/deploy ואימות Preview/Production.
- commit `9fe2a54` עבר CI `29734691146` ו־deploy `29734691163`; Preview deployment `5bc5be59` אישר upload/preview/duplicate/reference guard/archive/restore/mobile/keyboard מול D1/R2 אמיתיים. לאחר cleanup נשארו 16 media, ‏2 revisions, ‏0 sessions/FK/orphans; Production deployment `c394d49f` נשאר נקי ומאובטח. `ADM-005` נסגרה כ־`DONE` ו־`ADM-006` החלה.

### 2026-07-20 — ADM-006 admin management and revocation

- נוסף API מאומת ו־repository יחיד לניהול מנהלים ב־D1: add/activate/deactivate, normalization/unique, guard אטומי נגד self/last-active וביטול sessions בהשבתה; אין bootstrap route ציבורי.
- נוסף מסך responsive לניהול גישה עם סטטוס Google/session, אישור השבתה מפורש, הסברי נעילה והפעלה מחדש. ‏65/65 בדיקות סטודיו ו־full validation עברו.
- Wrangler local + Chrome בשני contexts אישרו create/deactivate/revoke browser session/reactivate/self protection; כל נתוני הבדיקה נוקו ו־FK נשאר תקין.
- commit `a2ccb76` עבר CI `29735767725` ו־deploy `29735767757`; Production deployments ‏`f38e2557`/`143a99a3` עלו, roots/health החזירו `200`, endpoint נשאר חסום ב־`401` ללא session ו־Production D1 נשאר עם מנהל פעיל יחיד ו־0 sessions/FK violations. `ADM-006` נסגרה כ־`DONE` ו־`ADM-007` החלה.

### 2026-07-20 — ADM-007 publish, history and rollback UX

- נוסף מסך typed יחיד שמפריד בין save draft לבין publish live, עם badges מדויקים, dirty guard, אישור revision, idempotency, double-submit guard, היסטוריית jobs/revisions, retry ו־rollback; לאחר פרסום אפשר ליצור טיוטה חדשה מהגרסה החיה.
- ‏70/70 בדיקות סטודיו ו־full validation עברו. Wrangler local אישר empty state מאומת; Preview `c0708653` אישר publish failure, retry attempt ‏1→2, rollback ויצירת draft מול D1/R2 אמיתיים.
- Preview שוחזר במדויק דרך bookmark `00000013-00000000-000050ae-1dc470640bd16ec10565779e3c03b15a` וחזר ל־2 revisions, ‏16 media, ‏0 jobs/sessions/FK.
- commits `41a0acf`/`d0d9d73`, ‏CI `29736709319` ו־deploy `29736709296` עברו; Production deployments ‏`96aae2c8`/`49395ef5` עלו, bundle/401/roots/health אומתו ו־Production D1 נשאר נקי. `ADM-007` נסגרה כ־`DONE` ו־`ADM-008` החלה.

### 2026-07-20 — ADM-008 accessibility, resilience and owner E2E

- הושלמו offline recovery, beforeunload warning, focus לשגיאת validation, confirmation focus/Escape, busy/idempotency resilience ותיקון ניגודיות. בדיקת Preview גילתה ותיקנה גם stale draft בין save לפרסום, עם callback/query refresh ובדיקת רגרסיה.
- ‏72/72 בדיקות סטודיו ו־full validation עברו. Chrome אימת דסקטופ ו־375×812 ללא overflow, warning/recovery אחרי offline, ו־owner flow מלא login→edit→upload→save→publish→history→rollback. Lighthouse בדסקטופ ובמובייל: Accessibility ‏100 ו־Best Practices ‏100.
- Preview שוחזר ל־bookmark `00000015-00000000-000050ae-e0b75d8e6ac03f37b5ca57fffac8f458`, objects זמניים נמחקו, ונשארו 2 revisions, ‏16 media ו־0 jobs/sessions/FK/orphans. Commits `bd1e274`/`d6e4261`, ‏CI `29738508380`, deploy `29738508448` ו־Production deployments ‏`37321658`/`e2463839` אומתו; Production D1 נשאר נקי. `ADM-008` נסגרה כ־`DONE` ו־`QA-001` החלה.

### 2026-07-20 — QA-001 risk-based automated coverage

- נוספו בדיקות business transformation ל־public adapter, מודל עריכת ששת החלקים וקישורי WhatsApp; fixture כפול אוחד ל־test-only export משותף בלי להרחיב את API הייצור הראשי.
- סקירת הסיכונים מיפתה את הכיסוי הקיים ל־contracts, migration, auth/security, revisions/publish, rendering, interactions, forms ומדיה; legacy sections חסומים הן בחוזה והן בבדיקות regression מפורשות.
- ‏133/133 בדיקות ב־35 קבצים ו־full validation עברו, ללא snapshot assertions רחבים וללא שינוי ב־bundle sizes.
- commit `7849089`, ‏CI `29739268107`, deploy `29739268106` ו־Cloudflare deployments ‏`39eb7375`/`2d547fcb` אומתו. ה־roots וה־health החיים החזירו `200`, endpoint מאומת נשאר `401`, ו־Production D1 נשאר ריק ותקין. `QA-001` נסגרה כ־`DONE` ו־`QA-002` החלה.

### 2026-07-20 — QA-002 accessibility verification

- Lighthouse/axe מקומי וב־Production החזיר Accessibility ‏100 בדסקטופ ובמובייל; contrast עבר וללא violations קריטיים או רציניים.
- keyboard walkthrough חשף ותיקן focus ל־skip link, כניסה/יציאה מתפריט המובייל והחרגת backdrop לא־טאבי ממנגנון ה־Dialog המשותף. נוספו בדיקות regression; ‏134/134 בדיקות ו־full validation עברו.
- screen-reader/a11y-tree smoke אישר landmarks, היררכיית כותרות, ששת labels של sections, שמות controls, alt text, IDs ייחודיים ו־reduced-motion stylesheet חי.
- commit `ff52894`, ‏CI `29740055874`, deploy `29740055815` ו־Cloudflare deployments ‏`2052d66f`/`e2f21af4` אומתו. Production החזיר `200` ונשאר עם D1 נקי. `QA-002` נסגרה כ־`DONE` ו־`QA-003` החלה.

### 2026-07-20 — QA-003 responsive visual verification

- חמישה viewports נבדקו מקומית וב־Production: ‏375×812, ‏812×375, ‏768×1024, ‏1024×768 ו־1440×1000. screenshots ו־DOM measurements אישרו 0 overflow/clipping/broken media/distortion וחזות עקבית לכל ששת האזורים.
- צילום מהיר חשף ותיקן reveal elements שיכלו להישאר שקופים אחרי קפיצה בגלילה; policy משותף ובדיקת regression מכסים כעת גם elements שנדלקו מעל ה־viewport.
- ב־375px נוסף clearance עם safe-area לפוטר לאחר שה־sticky CTA הסתיר את הקישור האחרון; בפרודקשן נשארו 44px גלויים בין הקישור לסרגל בקצה הגלילה.
- ‏135/135 בדיקות ו־full validation עברו. commit `870f412`, ‏CI `29741056702`, deploy `29741056760`, deployments ‏`385b0df2`/`0d9e5b85` ו־bundle החי אומתו; Production נשאר `200` ו־D1 נקי. `QA-003` נסגרה כ־`DONE` ו־`QA-004` החלה.

### 2026-07-20 — QA-005 duplication and architecture audit

- הוסרו unsafe assertions ו־deep test wrapper; snapshot generated מקבל כעת טיפוס מפורש ונתוני fallback עומדים בחוזה במקום להסתיר פערים באמצעות cast.
- שלוש משפחות duplication אמיתיות אוחדו ל־helpers ממוקדים. ‏`jscpd` חזר עם 0 clones על 117 קובצי authored, ‏`madge` עם 0 cycles על 136 קבצים, ו־`rg` עם 0 `any`/unsafe assertions/directives בקוד הייצור.
- ‏137/137 בדיקות ו־full validation עברו. commit `be59cea`, ‏CI `29745014493`, deploy `29745014576`, deployments ‏`d183721a`/`6a9f12d5` ו־Production browser אומתו. `QA-005` נסגרה כ־`DONE`; המשימה הפתוחה הראשונה לפי סדר התלויות, `MIG-004`, החלה.

### 2026-07-20 — MIG-004 Production freeze and content cutover

- גיבוי delta טרי (`29745345594`/`8462164511`) הוכיח שאין שינוי תוכן או מדיה מאז מקור ההגירה; זמן freeze, hashes ו־counts נשמרו ב־signed checklist.
- לפני כתיבה נשמר bookmark ‏`00000025-…7448740`. importer משותף ומוגן ב־confirmation העלה ואימת 16/16 R2 objects ויצר draft/published יחידים ב־D1 עם 0 jobs/FK.
- owner smoke מאומת טען את כל הסטודיו מ־Production, ביצע edit/save/restore גרסה ‏1→3 וניקה session; endpoint הציבורי ומדיית R2 עברו. ‏138/138 בדיקות ו־full validation עברו.
- commit `27df281`, ‏CI `29752899522`, deploy `29752898113` ו־deployments ‏`0468b11e`/`9b20f62d` אומתו. `MIG-004` נסגרה כ־`DONE` ו־`MIG-005` החלה; Google נשאר read-only ו־public workflow עדיין ב־legacy lane עד ה־two-cycle cutover הבא.

### 2026-07-20 — MIG-005 public D1/R2 cutover and rollback proof

- `PUBLIC_CONTENT_SOURCE=cloudflare` הופעל; run `29753303132` בנה רק מ־published D1/R2 ודילג במפורש על Google.
- publish של `b5bd90fb` גרסה 3 הפעיל job ‏`5010889c` ו־run `29753561045`; endpoint החי הצביע לאותו revision/version לאחר deployment ‏`73720f93`.
- rollback ל־`b6398b25` יצר published ‏`d3896654`, job ‏`05c76da1` ו־run `29753803003`; Production חזר לתוכן ול־updatedAt המקוריים. Chrome אישר שישה sections, ‏0 broken media/overflow/console errors.
- sessions זמניים נוקו, D1 נשאר עם 16 media, שני audit jobs ו־0 FK. `MIG-005` נסגרה כ־`DONE`; לאחר initial cutover + publish + rollback + שלושה deploys ירוקים, stability gate אומת ו־`MIG-006` החלה תחת אישור הביצוע המלא של בעל הפרויקט.
