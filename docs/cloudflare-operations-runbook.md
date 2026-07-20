# Cloudflare operations runbook

מסמך זה הוא נוהל התפעול של אתר Nis Boutique Catering על Workers/Pages Functions, ‏D1 ו־R2. אין להעתיק לכאן token, cookie, request body, תוכן לקוח או כתובת דוא״ל.

## מכסות וספי התרעה

המקורות הקובעים הם מסמכי Cloudflare הרשמיים: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) ו־[R2 pricing](https://developers.cloudflare.com/r2/pricing/).

| מדד | מכסה חינמית | Warning | Critical | חלון |
|---|---:|---:|---:|---|
| Workers/Pages Functions requests | 100,000 | 70,000 | 85,000 | יום UTC |
| D1 rows read | 5,000,000 | 3,500,000 | 4,250,000 | יום UTC |
| D1 rows written | 100,000 | 70,000 | 85,000 | יום UTC |
| D1 storage | 5 GB | 3.5 GB | 4.25 GB | סך החשבון |
| R2 Class A operations | 1,000,000 | 700,000 | 850,000 | חודש |
| R2 storage | 10 GB-month | 7 GB | 8.5 GB | חודש |

ה־R2 monitor סופר את כל הפעולות מול מכסת Class A הנמוכה יותר. זו הערכה שמרנית: Class B כוללת 10 מיליון פעולות, אבל ההתראה אינה מניחה סיווג מקל. הספים של 70% ו־85% משאירים מרווח תגובה; הם אינם נעילה מוחלטת. אם מגיעים ל־Critical עוצרים imports, uploads ו־publishes שאינם חיוניים, בודקים את מקור העלייה, ורק לאחר ירידה או איפוס המכסה מחזירים פעילות.

## ניטור והתראות

ה־workflow `Cloudflare Usage Monitor` רץ מדי יום ב־04:17 UTC וגם ידנית. הוא קורא את Cloudflare GraphQL Analytics ואת D1 inventory באמצעות secrets של GitHub, כותב טבלת מדדים ל־job summary, מפיק warning ב־70% ונכשל ב־85%. כשל workflow הוא ההתראה התפעולית ואינו מדליף credentials.

בדיקה ידנית: Cloudflare Dashboard → Workers & Pages → Account Analytics עבור requests; Storage & Databases → D1 → Metrics → Row Metrics עבור reads/writes; ‏R2 → Metrics עבור storage ו־operations. משווים את אותו חלון UTC לטבלת ה־workflow.

בדיקות סימולציה:

```sh
node scripts/check-cloudflare-usage.mjs --simulate=safe
node scripts/check-cloudflare-usage.mjs --simulate=critical
```

הראשונה חייבת לצאת בקוד 0; השנייה חייבת לצאת בקוד 2 ולהציג `critical` בלי מידע רגיש.

## לוגים תפעוליים

אירוע `api_request` כולל רק: timestamp, event, requestId, method, path ללא query, status, durationMs ו־errorCode יציב. אירוע `publish_job` כולל רק requestId, jobId, revisionId, operation, status ו־attemptCount. אין לכתוב headers, cookies, auth token, principal, body, תוכן או פרטי אדם. requestId משותף לתשובת ה־API וללוג; jobId/revisionId מאפשרים חיבור בטוח להיסטוריית הפרסום.

## גיבוי לפני שינוי

1. ודא שה־working tree נקי ושמור את deployment/commit הפעיל.
2. צור D1 Time Travel bookmark קריא בלבד:

   ```sh
   pnpm --filter @monorepo/nis-content-studio exec wrangler d1 time-travel info nis-content-production --remote
   ```

3. שמור את ה־bookmark, timestamp ו־migration count בראיות המשימה; אין לשמור token.
4. לפני שינוי R2 הפק manifest עם object key, size ו־SHA-256; השווה אותו ל־media rows ול־published references. אל תמחק object שאין לו manifest מאומת.
5. ודא `/api/health` ו־public roots מחזירים 200 לפני השינוי.

## תרגיל ושחזור D1

תרגיל tabletop מבוצע ללא שינוי Production: מתעדים bookmark, מאמתים migrations ו־FK, מציינים מי מאשר rollback ומריצים את בדיקות הבריאות. שחזור אמיתי דורש אישור מפורש וחלון תחזוקה. בודקים תחילה ב־Preview או במסד חדש, ואז:

```sh
pnpm --filter @monorepo/nis-content-studio exec wrangler d1 time-travel restore nis-content-production --bookmark=<BOOKMARK> --remote
```

לאחר restore: הרץ migrations במצב no-op, ‏`PRAGMA foreign_key_check`, ספירת revisions/media/jobs, login, published snapshot ו־health. אם אחת הבדיקות נכשלת, עצור פרסום ואל תמחק את ראיות השחזור.

## ביטול sessions

לביטול כל sessions של admin מסוים:

```sql
DELETE FROM admin_sessions WHERE admin_id = '<ADMIN_UUID>';
SELECT COUNT(*) AS remaining FROM admin_sessions WHERE admin_id = '<ADMIN_UUID>';
```

לאירוע אבטחה חמור מבטלים את כולם בתוך transaction מאושר: `DELETE FROM admin_sessions;` ואז מאמתים `SELECT COUNT(*) FROM admin_sessions;` שווה 0. ה־admin נדרש להתחבר מחדש; אין להעתיק session hash ללוג או למסמך.

## Publish שנכשל

1. קבל requestId מהתגובה וחפש `publish_job` לפי jobId/revisionId; אל תאסוף body או token.
2. קרא `GET /api/publish/history` עם session מאומת ובדוק status, operation, attemptCount ו־errorCode.
3. תקן את הסיבה: object חסר/פגום, schema לא תקין או GitHub dispatch.
4. הפעל `POST /api/publish/retry` פעם אחת עם `{ "jobId": "..." }`; אין ליצור revision כפול.
5. ודא שה־job עבר ל־`dispatched`, ה־workflow הסתיים והאתר הציבורי מציג את revision הנכון. אם האתר שגוי, השתמש ב־`POST /api/publish/rollback` ל־revision הקודם ובדוק שוב.

## סיום אירוע

מתעדים זמן, request/job/revision IDs, bookmark, commit/deployment, תוצאה ופעולת מניעה בלבד. מאמתים health, login, public snapshot, referenced media, ‏0 FK violations ו־0 orphan objects. כל קובץ זמני או session בדיקה נמחקים במדויק.
