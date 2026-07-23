# NIS Content Studio

ה־Studio הוא מערכת ניהול התוכן של האתר. הוא פועל על Cloudflare Pages ו־Pages Functions, בלי שרת קבוע.

## ארכיטקטורה

- **D1** הוא מקור האמת לתוכן, גרסאות, משתמשי אדמין, סשנים, משימות פרסום ומטא־דאטה של מדיה.
- **R2** שומר את קובצי המדיה המקוריים.
- **Google Identity** משמש להזדהות בלבד. ההרשאה בפועל נבדקת בצד השרת מול טבלת האדמינים ב־D1.
- האתר הציבורי נבנה מהגרסה המסומנת `published` דרך `GET /api/content/published`.
- ה־Studio משתמש באותו חוזה תוכן משותף שב־`packages/content-schema`.

## פיתוח מקומי

```bash
npx --yes pnpm@9.15.9 install --frozen-lockfile
npx --yes pnpm@9.15.9 db:migrate:local
npx --yes pnpm@9.15.9 admin:pages:dev
```

להרצת האתר הציבורי מול מסמך התוכן הציבורי המחויב:

```bash
npx --yes pnpm@9.15.9 dev
```

ה־checkout מחזיק `publicSiteDocument.generated.ts` יחיד עבור פיתוח מקומי. בניית Cloudflare
מחליפה אותו בגרסה המפורסמת מ־D1/R2 דרך `content:sync:cloudflare`.

לבדיקת מסלול הבנייה של פרודקשן:

```bash
CLOUDFLARE_CONTENT_API_ORIGIN=https://studio.nisboutiquecatering.com \
VITE_GOOGLE_CLIENT_ID=<oauth-client-id> \
npx --yes pnpm@9.15.9 parity:local:deploy
```

## הגדרות וסודות

ה־Studio דורש:

- `GOOGLE_CLIENT_ID` בצד השרת ו־`VITE_GOOGLE_CLIENT_ID` בבנייה, עם אותו OAuth client.
- `GITHUB_DISPATCH_TOKEN`, כאשר רוצים שהפרסום יפעיל בנייה חדשה אוטומטית.
- bindings בשם `DB` ל־D1 ובשם `MEDIA` ל־R2.
- סודות הפריסה הרגילים של Cloudflare בתוך GitHub Actions.

אין להוסיף הרשאות תוכן לספק ההזדהות. ה־OAuth מיועד ל־`openid`, `email` ו־`profile` בלבד.

## עבודה שוטפת

1. מתחברים ל־Studio.
2. עורכים טיוטה ושומרים. כל שמירה מעלה את מספר הגרסה ומוגנת מפני כתיבה על גרסה ישנה.
3. בודקים את התצוגה המקדימה.
4. מפרסמים. השרת מסמן גרסה אחת בלבד כ־`published`, יוצר משימת פרסום ומפעיל את GitHub Actions.
5. הבנייה מושכת את הגרסה המפורסמת מ־D1 ואת המדיה מ־R2 ומפרסמת את שני אתרי Pages.

## מדיה

- העלאה נוצרת דרך endpoint חתום ומוגן אדמין.
- הקובץ נשמר ב־R2 והמטא־דאטה נשמר ב־D1.
- מחיקה רכה מונעת שבירת גרסאות קיימות.
- אין למחוק אובייקט שנמצא בשימוש בתוכן מפורסם.

## שחזור ו־rollback

- היסטוריית הגרסאות נשמרת ב־D1.
- פעולת rollback יוצרת גרסה מפורסמת חדשה מתוכן של גרסה קודמת; היא אינה משנה היסטוריה קיימת.
- גיבוי ההגירה הראשוני נשמר בתיקיית `backups/` כארטיפקט שחזור בלתי משתנה.

## בדיקות לפני פרסום

```bash
npx --yes pnpm@9.15.9 validate
npx --yes pnpm@9.15.9 migration:backup:verify
```

בפרודקשן יש לבדוק גם את `/api/health`, את `/api/content/published`, כניסת אדמין, שמירה, preview, publish והאתר הציבורי.
