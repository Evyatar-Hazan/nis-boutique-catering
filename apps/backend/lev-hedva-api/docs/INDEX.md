# 📚 Server Documentation - Lev-Hedva

Documentation for NestJS Server (Backend).

## 🏗️ Project Structure

```
Lev-Hedva-sever/
├── src/
│   ├── modules/         # Main modules
│   │   ├── auth/       # Authentication and authorization
│   │   ├── users/      # User management
│   │   ├── products/   # Product management
│   │   ├── loans/      # Loan management
│   │   ├── volunteers/ # Volunteer management
│   │   └── audit/      # Audit tracking and logs
│   ├── common/         # Guards, Interceptors, DTOs
│   ├── prisma/         # Prisma service
│   └── main.ts         # Entry point
├── prisma/
│   ├── schema.prisma   # Database schema
│   ├── migrations/     # migrations
│   └── seed.ts         # Seed data
└── scripts/           # Utility scripts
```

## 🛠️ Technologies

- **NestJS** - Node.js framework
- **Prisma** - ORM for database management
- **PostgreSQL** - Database
- **JWT** - User authentication
- **Passport** - Authentication strategies
- **TypeScript** - Development language
- **Jest** - Testing framework

## 🚀 פקודות שימושיות

```bash
# פיתוח
npm run start:dev

# בנייה
npm run build

# בדיקות
npm test
npm run test:e2e

# Prisma
npx prisma migrate dev      # הרצת migrations
npx prisma studio          # UI לבסיס נתונים
npx prisma generate        # יצירת Prisma Client

# ניהול admin
npm run create-admin       # יצירת משתמש admin
npm run reset-admin        # איפוס סיסמת admin
```

## 🗄️ בסיס נתונים

### מודלים עיקריים

- **User** - משתמשים ומנהלים
- **Volunteer** - מתנדבים
- **Product** - מוצרים
- **ProductInstance** - מופעי מוצרים
- **Loan** - השאלות
- **AuditLog** - לוג פעולות

### Migrations

כל ה-migrations נמצאים ב-`prisma/migrations/`

## 🔐 אבטחה

- JWT tokens לאימות
- Role-based access control (RBAC)
- Password hashing עם bcrypt
- Audit logging לכל פעולה
- CORS configuration

## 🔗 קישורים

- [README ראשי](../README.md)
- [תיעוד כללי](../../docs/)
- [תיעוד קליינט](../../Lev-Hedva-client/docs/)

## 📡 API Documentation

השרת מריץ Swagger UI ב-`http://localhost:3001/api` (בסביבת פיתוח).

---

**טיפ:** השתמש ב-`npm run create-admin` ליצירת משתמש admin ראשון אחרי התקנה.
