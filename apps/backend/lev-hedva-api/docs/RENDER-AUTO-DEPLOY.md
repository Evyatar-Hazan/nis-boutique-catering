# Deployment אוטומטי ל-Render עם Prisma Migrations

## סקירה כללית

הפרויקט משתמש ב-Prisma migrations כדי לעדכן אוטומטית את מבנה הבסיס נתונים והנתונים בכל deployment, **ללא מחיקת נתונים קיימים**.

## איך זה עובד?

### Prisma Migrations - הפתרון האידיאלי

Prisma מנהל מערכת migrations מתוחכמת שעוקבת אחרי כל שינוי במבנה הנתונים:

1. **Schema Changes** - שינויים ב-`schema.prisma`
2. **Data Migrations** - עדכוני נתונים (כמו פורמט הרשאות)
3. **Version Control** - כל migration נשמר בגיט

### תהליך ה-Deployment

```yaml
# render.yaml
buildCommand: |
  npm install
  npx prisma generate
  npm run build

startCommand: |
  npx prisma migrate deploy  # ← מריץ רק migrations שטרם הופעלו
  npm run start:prod
```

## מה קורה בכל Deployment?

1. ✅ Render מושך קוד מ-GitHub
2. ✅ מתקין dependencies
3. ✅ מייצר Prisma Client
4. ✅ בונה את הפרויקט
5. ✅ **`prisma migrate deploy`** - מריץ רק migrations חדשים
6. ✅ מפעיל את השרת

## יתרונות Prisma Migrations

### 🎯 חכם ויעיל

- רץ **רק** migrations שטרם הופעלו
- לא משנה כמה פעמים תעשה deploy
- שומר נתונים קיימים

### 🔒 בטוח לחלוטין

- כל migration עובר בדיקה
- אפשר לבדוק ב-development לפני production
- Rollback אפשרי במקרה של בעיה

### 📦 Version Control

- כל migration בגיט
- היסטוריה מלאה של שינויים
- אפשר לעקוב אחרי מה השתנה ומתי

## איך ליצור Migration חדש?

### שינוי ב-Schema

```bash
# 1. ערוך את prisma/schema.prisma
# 2. צור migration חדש
npx prisma migrate dev --name describe_your_change

# 3. עשה commit ו-push
git add .
git commit -m "feat: add new field to User model"
git push
```

### Data Migration (עדכון נתונים)

```bash
# 1. צור migration ריק
npx prisma migrate dev --name update_data --create-only

# 2. ערוך את קובץ ה-SQL שנוצר
# prisma/migrations/TIMESTAMP_update_data/migration.sql

# 3. כתוב SQL לעדכון הנתונים
UPDATE "User" SET role = 'WORKER' WHERE email LIKE '%@company.com';

# 4. הרץ את ה-migration
npx prisma migrate dev

# 5. עשה commit ו-push
git add .
git commit -m "feat: update user roles"
git push
```

## דוגמה: Migration של עדכון הרשאות

הקובץ:

```
prisma/migrations/20251216130854_update_permissions_format/migration.sql
```

מכיל SQL שמעדכן:

- ✅ שמות הרשאות קיימות
- ✅ יוצר הרשאות חדשות
- ✅ מעדכן קשרים למשתמשים
- ✅ **ללא מחיקת נתונים**

## בדיקה לפני Production

```bash
# Development
npx prisma migrate dev

# אם הכל טוב ב-dev, תעשה push
# Render ירוץ אוטומטית:
npx prisma migrate deploy
```

## Troubleshooting

### Migration נכשל ב-Production

```bash
# בדוק מה הבעיה
npx prisma migrate status

# אם צריך לסמן migration כהופעל (רק אם הנתונים כבר עודכנו)
npx prisma migrate resolve --applied MIGRATION_NAME

# אם צריך לבטל
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### שינויים לא מתעדכנים

```bash
# ודא ש-migration נמצא בגיט
git status
git add prisma/migrations/
git commit -m "feat: add migration"
git push
```

## התצורה ב-Render Dashboard

אם לא משתמש בקובץ `render.yaml`:

### Build Command

```bash
npm install && npx prisma generate && npm run build
```

### Start Command

```bash
npx prisma migrate deploy && npm run start:prod
```

## סיכום - למה זה מושלם?

✅ **אוטומטי** - Push לגיט = עדכון אוטומטי
✅ **בטוח** - רק migrations חדשים רצים
✅ **חכם** - Prisma יודע מה כבר רץ
✅ **Version Control** - היסטוריה מלאה
✅ **שומר נתונים** - אף פעם לא מוחק נתונים קיימים
✅ **כללי** - עובד לכל שינוי בבסיס נתונים

## זרימת עבודה מומלצת

```bash
# 1. עבוד ב-development
npm run start:dev

# 2. שנה schema או צור data migration
npx prisma migrate dev --name my_change

# 3. בדוק שהכל עובד
npm test

# 4. Push לגיט
git add .
git commit -m "feat: my awesome change"
git push origin main

# 5. ✨ Render עושה את השאר אוטומטית!
```

**זהו! אין צורך לעשות יותר כלום ידנית! 🎉**
