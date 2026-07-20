---
title: NIS Public Site Redesign Tracker
status: planning
owner: Evyatar Hazan
created: 2026-07-20
updated: 2026-07-20
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

- **מצב נוכחי:** Google Sheets הוא מקור התוכן המובנה ו־Google Drive הוא מקור המדיה המקורית.
- **מצב יעד:** Cloudflare D1 הוא מקור האמת לתוכן, אדמינים, sessions וגרסאות פרסום; Cloudflare R2 הוא מקור האמת לקובצי מדיה מקוריים.
- `packages/content-schema` נשאר החוזה הטיפוסי היחיד בין API, סטודיו, build והאתר הציבורי.
- קובצי generated, fallback וה־assets המותאמים שנוצרים ב־build הם תוצרים נגזרים בלבד, לא משטח עריכה נוסף.
- בתקופת המעבר לא מנהלים שני מקורות אמת פעילים: Sheets/Drive נשארים authoritative עד cutover מאושר; לאחר cutover D1/R2 בלבד authoritative והחיבורים הישנים מוסרים.
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

## מצב קיים, פער וארכיטקטורת יעד

### מה כבר קיים ועובד

| שכבה | מצב נוכחי | קבצים/מערכות מרכזיים |
|---|---|---|
| אתר ציבורי | React/Vite סטטי על Cloudflare Pages; התוכן והמדיה נאספים בזמן build | `apps/frontend/nis-boutique-catering`, `scripts/sync-content.mjs` |
| סטודיו | React/Vite נפרד על Cloudflare Pages | `apps/admin/nis-content-studio` |
| חוזה תוכן | Zod + TypeScript משותפים | `packages/content-schema` |
| תוכן | הדפדפן קורא וכותב ישירות ל־Google Sheets עם Google access token | `src/googleApi.ts` |
| מדיה | הדפדפן מעלה ל־Google Drive; ה־build מוריד וממיר ל־WebP סטטי | `uploadImageToDrive`, `sync-content.mjs` |
| הרשאה | Google OAuth בדפדפן, allowlist ב־Sheets/env ו־metadata ב־`sessionStorage` | `useStudioAuthSession.ts`, `studioAdmins.ts` |
| פרסום | Apps Script מאמת משתמש Google ומפעיל `workflow_dispatch` ב־GitHub | `tools/google-apps-script/publish-proxy.gs` |
| Deploy | GitHub Actions בונה ומעלה שני פרויקטי Pages נפרדים | `.github/workflows/cloudflare-pages.yml` |

### הפער מול ארכיטקטורת היעד

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

- **Status:** `BACKLOG`
- **Dependencies:** `ARC-002`, `UI-002`, `CF-007`.
- **Definition:** לאחד gallery ו־real media למשטח מדיה אחד, מהיר ונגיש.
- **Acceptance criteria:**
  - מוצגות 6–9 תמונות ראשוניות ווידאו אחד.
  - filters נגזרים מה־schema ואינם hardcoded בכמה מקומות.
  - lightbox נגיש ל־keyboard ומחזיר focus.
  - image variants, lazy loading ו־dimensions עובדים לכל media item.
- **Verification:** media check, keyboard/lightbox tests, network inspection, CLS measurement ו־broken asset scan.
- **Evidence:** pending.

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

- **Status:** `IN_PROGRESS`
- **Dependencies:** `MIG-002`, `CF-006`, `CF-007`.
- **Definition:** לייבא את כל התוכן והמדיה ל־D1/R2 preview ולהריץ parity מלאה בלי להשפיע על production.
- **Acceptance criteria:** counts/IDs/hashes תואמים; כל media נפתחת; draft/published מוגדרים; אין orphan/duplicate object; admin bootstrap תקין.
- **Verification:** automated parity report, R2 object HEAD/read sampling, preview studio login ו־preview public build.
- **Evidence:** העבודה החלה מהתוצרים הקנוניים של `MIG-002`; הייבוא יבוצע רק מול D1/R2 Preview ולא ישנה את Production.

#### MIG-004 — Run the production freeze, delta import and cutover

- **Status:** `BACKLOG`
- **Dependencies:** `MIG-003`, `ADM-008`, explicit cutover approval.
- **Definition:** לבצע חלון הקפאת כתיבה, delta export/import, parity ואז להעביר את הסטודיו ל־API החדש.
- **Acceptance criteria:** זמן freeze מתועד; אין delta חסר; owner flow עובר לפני פתיחת כתיבה; feature/config rollback יכול להחזיר את הסטודיו הישן במהלך החלון.
- **Verification:** signed cutover checklist, before/after hashes, authenticated owner smoke ו־audit log.
- **Evidence:** pending.

#### MIG-005 — Cut over the public build and prove rollback

- **Status:** `BACKLOG`
- **Dependencies:** `MIG-004`, `CF-009`.
- **Definition:** להעביר CI מ־Google sync ל־D1/R2 sync, לפרוס ולבדוק גם publish חדש וגם rollback revision.
- **Acceptance criteria:** אותו published revision מגיע ל־generated snapshot ול־production; media סטטית תקינה; rollback מחזיר תוכן קודם; Sheets/Drive נשארים read-only בתקופת הביטחון.
- **Verification:** two-cycle E2E: publish → live verify → rollback → live verify, כולל SHA/revision/run IDs.
- **Evidence:** pending.

#### MIG-006 — Retire Google content infrastructure

- **Status:** `BACKLOG`
- **Dependencies:** `MIG-005`, stability window and explicit approval.
- **Definition:** להסיר Google Sheets/Drive/Picker/Apps Script/service-account paths, scopes, secrets וקוד תיעוד ישן לאחר אישור היציבות.
- **Acceptance criteria:** אין runtime/build reference ל־Sheets/Drive; OAuth מבקש identity בלבד; secrets ישנים בוטלו; backup נשמר לפי retention; docs מצביעים רק על D1/R2.
- **Verification:** `rg` audit, clean install/build/test, secret inventory, OAuth consent review ו־production publish נוסף.
- **Evidence:** pending.

### Phase 6 — Admin rebuild on the server/client contract

#### ADM-001 — Split the admin monolith into owned modules

- **Status:** `BACKLOG`
- **Dependencies:** `ARC-003`, `CF-003`.
- **Definition:** לפרק את `App.tsx` ל־shell, routes/tabs ו־feature modules בלי ליצור wrappers או UI כפולים.
- **Acceptance criteria:** `App.tsx` הוא composition root; כל feature בקובץ/תיקייה ייעודיים; primitives משותפים reused; imports לפי public boundaries.
- **Verification:** component ownership review, dependency graph, type-check ו־duplication search.
- **Evidence:** pending.

#### ADM-002 — Replace Google OAuth data access with session UX

- **Status:** `BACKLOG`
- **Dependencies:** `CF-004`, `ADM-001`.
- **Definition:** להשתמש ב־Google רק לכניסה, להחליף access-token lifecycle ב־`/api/auth/*` cookie session ולהוסיף logout/session-expired UX.
- **Acceptance criteria:** אין Sheets/Drive scopes; אין token ב־storage/state מעבר לרגע exchange; refresh משחזר session; 401 מחזיר למסך כניסה בלי אובדן טיוטה מקומית לא צפוי.
- **Verification:** browser login/refresh/logout/expiry/revocation tests ו־storage/network inspection.
- **Evidence:** pending.

#### ADM-003 — Build one typed API client and query-state layer

- **Status:** `BACKLOG`
- **Dependencies:** `CF-003`, `ADM-001`.
- **Definition:** ליצור client יחיד ל־API עם credentials, schema parsing, error mapping, cancellation ו־retry מוגבל לקריאות idempotent.
- **Acceptance criteria:** feature modules אינם קוראים `fetch` ישירות; DTOs מגיעים מהחוזה המשותף; conflict/auth/network errors מובחנים; אין retry אוטומטי ל־publish/upload mutation.
- **Verification:** client unit tests, mocked failure matrix ו־`rg "fetch\("` שמאשר בעלות מרכזית.
- **Evidence:** pending.

#### ADM-004 — Implement six-section content editing and preview

- **Status:** `BACKLOG`
- **Dependencies:** `ADM-003`, `ARC-002`, `CF-006`.
- **Definition:** לבנות עורכים ברורים ל־Hero, Services, Gallery, Process, Trust ו־Contact על אותו `ContentSnapshot`.
- **Acceptance criteria:** אין legacy sections; validation field-level; dirty/conflict states ברורים; preview משתמש ב־`packages/site-preview`/shared contracts ולא ב־markup מועתק.
- **Verification:** load→edit→validate→save→reload לכל section, component tests ו־preview parity screenshots.
- **Evidence:** pending.

#### ADM-005 — Implement R2 media library and safe editing

- **Status:** `BACKLOG`
- **Dependencies:** `ADM-003`, `CF-007`, `WEB-003`.
- **Definition:** לבנות library אחת ל־upload/select/alt/replace/archive/restore של תמונות ווידאו.
- **Acceptance criteria:** progress/error/retry; preview מקומי בטוח; alt חובה לשימוש ציבורי; reference count מוצג לפני archive; אותו picker משמש Hero/Services/Gallery.
- **Verification:** real preview uploads, invalid files, reuse same media, referenced delete, keyboard flow ו־mobile flow.
- **Evidence:** pending.

#### ADM-006 — Implement admin management and session revocation

- **Status:** `BACKLOG`
- **Dependencies:** `ADM-003`, `CF-004`, `CF-005`.
- **Definition:** להעביר ניהול אדמינים ל־D1 ולהוסיף add/activate/deactivate תוך הגנה מנעילה עצמית.
- **Acceptance criteria:** email normalized/unique; לא ניתן להשבית את האדמין הפעיל האחרון או את עצמך בלי handoff; deactivation מבטלת sessions; אין public bootstrap route.
- **Verification:** CRUD authorization tests, last-admin/self-deactivate tests ו־revoked browser session test.
- **Evidence:** pending.

#### ADM-007 — Implement draft, publish, history and rollback UX

- **Status:** `BACKLOG`
- **Dependencies:** `ADM-004`, `ADM-005`, `CF-008`.
- **Definition:** להציג save state, revision history, publish progress/failure ו־rollback מפורש בלי לערבב save draft עם live deploy.
- **Acceptance criteria:** draft/published badges מדויקים; publish confirmation מציג revision; failed job ניתן retry; rollback דורש confirmation ומציג תוצאה; double-submit חסום.
- **Verification:** component/integration tests לכל state ו־authenticated preview workflow כולל dispatch failure.
- **Evidence:** pending.

#### ADM-008 — Complete admin accessibility, resilience and E2E gate

- **Status:** `BACKLOG`
- **Dependencies:** `ADM-002`–`ADM-007`.
- **Definition:** להשלים responsive, keyboard, focus, error recovery ו־owner E2E לפני cutover.
- **Acceptance criteria:** כל פעולה קריטית עובדת ב־375px ובדסקטופ; אין אובדן שינוי ללא warning; focus/errors נגישים; reload/network interruption ניתנים להתאוששות; owner flow מלא עובר ב־preview.
- **Verification:** axe + keyboard + mobile screenshots + network-offline tests + login→edit→upload→save→publish→history→rollback E2E.
- **Evidence:** pending.

### Phase 7 — Quality, regression and non-functional validation

#### QA-001 — Expand automated coverage

- **Status:** `BACKLOG`
- **Dependencies:** `WEB-001`–`WEB-006`, `CF-001`–`CF-010`, `ADM-001`–`ADM-008`, `MIG-003`.
- **Definition:** לכסות contracts, rendering, interactions, forms, media ו־content migration בבדיקות אוטומטיות.
- **Acceptance criteria:**
  - unit tests לכל business transformation.
  - component tests לכל interaction קריטי.
  - regression tests שמוכיחים שה־legacy sections אינם חוזרים.
  - אין snapshots רחבים שמסתירים שגיאות משמעותיות.
- **Verification:** `npx pnpm@9.15.9 test` וסקירת coverage לפי risk, לא רק אחוז כולל.
- **Evidence:** pending.

#### QA-002 — Verify accessibility

- **Status:** `BACKLOG`
- **Dependencies:** `QA-001`.
- **Definition:** לבצע audit מלא ל־keyboard, focus, semantics, contrast, screen reader ו־reduced motion.
- **Acceptance criteria:**
  - אין violation קריטי/רציני בכלי האוטומטי שנבחר.
  - כל המסלול ניתן להשלמה במקלדת בלבד.
  - focus order תואם לסדר החזותי.
  - gallery dialog ו־mobile menu מנהלים focus נכון.
- **Verification:** axe/Playwright, keyboard walkthrough, contrast checker ו־screen reader smoke test.
- **Evidence:** pending.

#### QA-003 — Verify responsive visual quality

- **Status:** `BACKLOG`
- **Dependencies:** `WEB-001`–`WEB-006`.
- **Definition:** לבצע visual QA מלא ב־375, 768, 1024 ו־1440 פיקסלים, כולל portrait/landscape רלוונטי.
- **Acceptance criteria:**
  - אין horizontal overflow.
  - אין טקסט חתוך, CTA מוסתר או media distortion.
  - spacing והיררכיית טקסט עקביים.
  - sticky/fixed elements אינם מסתירים תוכן.
- **Verification:** screenshots + DOM measurements + manual browser walkthrough.
- **Evidence:** pending.

#### QA-004 — Verify performance and media budgets

- **Status:** `BACKLOG`
- **Dependencies:** `QA-003`, `CF-007`, `CF-009`.
- **Definition:** למדוד ולהשוות לבסיס את LCP, CLS, TBT/INP, JS/CSS size ומדיה.
- **Acceptance criteria:**
  - אין regression לעומת baseline ללא החלטה מתועדת.
  - CLS נמוך מ־`0.1`.
  - hero media מותאם ואינו טוען וידאו כבד ללא צורך.
  - lazy loading אינו מציג אזורים ריקים או שובר גלריה.
- **Verification:** Lighthouse runs עקביים, bundle output, network waterfall ו־media check.
- **Evidence:** pending.

#### QA-005 — Perform duplication and architecture audit

- **Status:** `BACKLOG`
- **Dependencies:** `QA-001`–`QA-004`.
- **Definition:** לבצע ביקורת סופית שמוכיחה שהמימוש לא יצר duplication, monolith חדש או boundary violation.
- **Acceptance criteria:**
  - אין component/markup/style/business logic כפולים.
  - `App.tsx` נשאר composition root ולא implementation monolith.
  - אין `any`, unsafe assertions, deep imports או circular dependencies חדשים.
  - shared abstractions אינן כלליות מדי ולכל אחת צרכנים ברורים.
- **Verification:** `rg`, lint/type-check, dependency graph, focused code review ו־diff audit.
- **Evidence:** pending.

### Phase 8 — Release and production closure

#### REL-001 — Run the full local gate

- **Status:** `BACKLOG`
- **Dependencies:** `QA-001`–`QA-005`.
- **Definition:** להריץ את כל בדיקות הריפו בסביבת runtime תואמת CI.
- **Acceptance criteria:**
  - `pnpm doctor:runtime` עובר.
  - `npx pnpm@9.15.9 validate` עובר.
  - `npx pnpm@9.15.9 parity:local` עובר.
  - `npx pnpm@9.15.9 audit --prod` ללא finding לא מטופל.
- **Verification:** פלטי הפקודות וקודי יציאה מתועדים.
- **Evidence:** pending.

#### REL-002 — Deploy through the approved workflow

- **Status:** `BACKLOG`
- **Dependencies:** `REL-001`, explicit user approval to publish.
- **Definition:** לבצע commit/push/deploy רק לאחר אישור מפורש, דרך GitHub Actions ו־Cloudflare Pages הקיימים.
- **Acceptance criteria:**
  - commit scope נקי ואינו כולל artifacts או שינויים לא קשורים.
  - CI ו־deploy jobs ירוקים עבור אותו SHA.
  - לא בוצע bypass ל־content sync או security headers.
- **Verification:** git diff, workflow run IDs ו־Cloudflare deploy result.
- **Evidence:** pending.

#### REL-003 — Verify production end to end

- **Status:** `BACKLOG`
- **Dependencies:** `REL-002`.
- **Definition:** לאמת שהאתר החי מציג את המבנה החדש ועובד בכל המסלולים הקריטיים.
- **Acceptance criteria:**
  - production מציג בדיוק שישה `main` sections מתוכננים.
  - כל navigation anchor, CTA, gallery, video, FAQ וטופס עובדים.
  - HTTP 200 ו־security headers תקינים.
  - אין console errors או blocked CSP requests.
  - mobile ו־desktop production תואמים ל־QA המאושר.
- **Verification:** Chrome/Playwright, live DOM count, `curl -I`, console/network review ו־WhatsApp link assertions.
- **Evidence:** pending.

#### REL-004 — Close documentation and tracking

- **Status:** `BACKLOG`
- **Dependencies:** `REL-003`.
- **Definition:** לעדכן tracker, README/history, content-flow וה־vault כך שישקפו את המצב החי הסופי.
- **Acceptance criteria:**
  - כל משימה נסגרה עם evidence או בוטלה עם reason.
  - open risks ו־follow-ups מתועדים.
  - docs אינם מתארים sections או admin flow ישנים.
  - tracker מסומן `completed` רק לאחר אימות production.
- **Verification:** docs-to-code/live parity review ו־final diff check.
- **Evidence:** pending.

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
| RISK-001 | section שהוסר חוזר דרך managed defaults | לעדכן schema/defaults/studio/Sheets/frontend יחד ולהוסיף regression test | Open |
| RISK-002 | local fallback נראה תקין אך production remote content שונה | לאמת remote sync ו־production DOM אחרי deploy | Open |
| RISK-003 | אדמין חדש ומימוש public מקביל יוצרים רכיבים כפולים | לסגור `ARC-003`, להשתמש בחוזה/API client/preview משותפים ולבצע `QA-005` | Open |
| RISK-004 | מעבר Drive→R2 גורם לאובדן מדיה או orphan files | backup, hashes, dry run, stable IDs, reference checks ו־rollback window | Open |
| RISK-005 | גלריה/וידאו פוגעים ב־LCP או CLS | media budgets, responsive variants, lazy loading ו־reserved dimensions | Open |
| RISK-006 | כותרות עברית נופלות ל־font לא מכוון | לבחור font עברי מאומת ולבדוק network/rendering | Open |
| RISK-007 | טופס ארוך עדיין מייצר נטישה | לצמצם required fields ולבדוק mobile flow | Open |
| RISK-008 | העתקת חולשת email bearer או Base64 מיישום הייחוס | session שרתי בלבד, R2 streaming ו־negative security tests | Open |
| RISK-009 | שתי מערכות מקור אמת משתנות במקביל בזמן migration | freeze + delta import; Sheets/Drive authoritative עד cutover ואז read-only | Open |
| RISK-010 | migration D1 נכשל אחרי שינוי schema | migrations לפני deploy, backup, preview rehearsal ו־rollback runbook | Open |
| RISK-011 | publish מסמן revision live אבל dispatch/deploy נכשל | `publish_jobs`, סטטוס מפורש, retry idempotent והצגת last deployed revision | Open |
| RISK-012 | cookie session חשוף ל־CSRF | SameSite, Origin/CSRF validation וללא wildcard CORS | Open |
| RISK-013 | חריגה ממכסת Cloudflare Free | static public assets, rate limits, usage thresholds ו־runbook ב־`CF-010` | Open |
| RISK-014 | secrets נחשפים דרך `VITE_*`, logs או error payload | server-only secrets, redaction ו־bundle/log audits | Open |

## Progress summary

| Phase | Status | Done | Total |
|---|---|---:|---:|
| Phase 0 — Governance | Done | 4 | 4 |
| Phase 1 — Architecture | Done | 4 | 4 |
| Phase 2 — Design system | Done | 4 | 4 |
| Phase 3 — Public site | In progress | 5 | 6 |
| Phase 4 — Cloudflare backend | In progress | 2 | 10 |
| Phase 5 — Migration | Ready with dependencies | 0 | 6 |
| Phase 6 — Admin rebuild | Ready with dependencies | 0 | 8 |
| Phase 7 — Quality | Blocked | 0 | 5 |
| Phase 8 — Release | Blocked | 0 | 4 |

## Change Log

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
