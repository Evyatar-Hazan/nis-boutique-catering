# מפרט מדידת פניות ללא PII

## גבולות והגדרת המדד הראשי

המדד הראשי הראשון הוא מספר אירועי `nis_whatsapp_handoff`: פעולה מקומית שבה משתמש לחץ באתר על קישור WhatsApp, או השלים validation מקומי תקין של טופס והאתר ניסה להעביר אותו ל־WhatsApp.

האירוע אינו מוכיח שהמשתמש עבר בפועל לאפליקציה, שלח הודעה, שההודעה נקראה, שנוצרה פנייה עסקית, שהוזמנה הזמנה או שנסגרה עסקה. אין להסיק ממנו conversion עסקי מעבר ל־handoff מהאתר.

המימוש הנוכחי אינו מחובר לספק analytics, אינו שולח רשת ואינו אוסף נתונים חיים. ברירת המחדל מפיצה `CustomEvent` מקומי בשם `nis:lead-measurement`; חיבור sink חיצוני בעתיד דורש החלטה ואישור נפרדים.

## חוזה האירועים

כל אירוע כולל `schema_version: 1` ורק את ה־properties המפורטים כאן.

| event name | מתי נוצר | properties מותרים | מה הוא לא אומר |
| --- | --- | --- | --- |
| `nis_cta_click` | לחיצה על CTA מסומן שמוביל ל־WhatsApp | `cta_id`, ‏`destination: "whatsapp"` | לא אומר שהמעבר או שליחת הודעה הצליחו |
| `nis_lead_form_start` | אינטראקציה ראשונה עם טופס יצירת הקשר | `form_id: "contact"` | לא אומר שהטופס הושלם |
| `nis_lead_form_validation` | ניסיון submit שנבדק מקומית | `form_id`, ‏`result`, ‏`invalid_field_count` | לא כולל שמות שדות או ערכים; `valid` אינו ליד עסקי |
| `nis_lead_form_submit_success` | הטופס עבר validation מקומי והוכן handoff | `form_id`, ‏`next_step: "whatsapp_handoff"` | זהו success מקומי בלבד, לא שליחת הודעה או הזמנה |
| `nis_whatsapp_handoff` | לחיצת WhatsApp ישירה או ניסיון מעבר לאחר טופס תקין | `origin`, ‏`source` | לא הוכחת שליחה, קריאה, פנייה מאושרת או עסקה |

### ערכי allowlist

- `cta_id`: ‏`topbar_whatsapp`, ‏`hero_whatsapp`, ‏`services_whatsapp`, ‏`contact_whatsapp`, ‏`footer_whatsapp`, ‏`floating_whatsapp`, ‏`mobile_sticky_whatsapp`.
- `source`: ‏`topbar`, ‏`hero`, ‏`services`, ‏`contact`, ‏`footer`, ‏`floating`, ‏`mobile_sticky`, ‏`lead_form`.
- `origin`: ‏`direct` או `lead_form`.
- `result`: ‏`valid` או `invalid`.

## מידע אסור

אין להעביר או לגזור לאירוע:

- שם, טלפון, אימייל, תאריך אירוע, מספר סועדים או טקסט חופשי.
- תוכן הודעת WhatsApp, query string, ‏URL מלא או `href`.
- מזהה משתמש, לקוח, session, cookie, כתובת IP או fingerprint.
- מזהי קמפיין או referrer לפני אישור פרטיות והחלטה נפרדת.
- סטטוס קריאה, סטטוס הזמנה, סכום עסקה או טענה על conversion עסקי שאין לה מקור אמת מתאים.

## משפך בסיסי

1. `nis_cta_click` — עניין ב־CTA שמוביל ל־WhatsApp.
2. `nis_whatsapp_handoff` — המדד הראשי המאושר: ניסיון יציאה מהאתר ל־WhatsApp.
3. במסלול הטופס בלבד: `nis_lead_form_start` → `nis_lead_form_validation` → `nis_lead_form_submit_success` → `nis_whatsapp_handoff`.

יש לדווח בנפרד על handoff ישיר ועל handoff שמקורו בטופס באמצעות `origin`. אין להוסיף לשלב הבא "הודעה נשלחה" או "הזמנה נסגרה" ללא מקור נתונים מאושר ונפרד.

## תרחישי QA

1. לחיצה על כל אחד משבעת מיקומי WhatsApp יוצרת בדיוק `nis_cta_click` אחד ו־`nis_whatsapp_handoff` אחד עם source תואם.
2. `href` שמכיל `?text=` אינו מופיע ב־event payload, גם כאשר הוא כולל הודעה מוכנה מראש.
3. focus ראשון בשדה טופס יוצר `nis_lead_form_start` פעם אחת בלבד לכל mount.
4. submit לא תקין יוצר `nis_lead_form_validation` עם `result: "invalid"` וספירת שדות בלבד; אינו יוצר submit success או handoff.
5. submit תקין יוצר validation תקין, submit success מקומי ו־handoff שמקורו `lead_form`; ערכי הטופס אינם מופיעים באף payload.
6. ערכי DOM שאינם ב־allowlist נכשלים סגור ואינם נשלחים ל־sink.
7. ללא listener או sink מחובר אין קריאת רשת ואין שמירה מקומית.
