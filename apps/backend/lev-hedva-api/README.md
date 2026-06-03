# Lev Hedva Backend API 🚀

🏥 **מערכת ניהול ארגון לב חדוה** - Backend API מקיף הבנוי עם NestJS, TypeScript ו-PostgreSQL.

## 📚 תיעוד

התיעוד המפורט נמצא בתיקיית **[docs/](docs/INDEX.md)**:

- **[תיעוד טכני](docs/INDEX.md)** - מבנה, API ומודולים
- **[Swagger API](http://localhost:3001/api)** - תיעוד API אינטראקטיבי (בפיתוח)

## 🚀 תכונות עיקריות

### 🔐 אבטחה ואימות

- **JWT Authentication** עם Refresh Tokens
- **RBAC (Role-Based Access Control)** עם הרשאות מתקדמות
- **Rate Limiting** למניעת התקפות
- **Security Headers** עם Helmet
- **Password Hashing** עם bcrypt

### 📊 ניהול נתונים

- **ניהול משתמשים** - יצירה, עדכון, הפעלה/כיבוי
- **ניהול מוצרים** - קטלוג מלא עם מעקב מלאי
- **מערכת השאלות** - מחזור חיים מלא של השאלות
- **מעקב מתנדבים** - רישום פעילויות וסטטיסטיקות

### 🔍 מעקב וביקורת

- **Audit Logging** - רישום כל הפעולות במערכת
- **Request/Response Interceptor** - מעקב אוטומטי אחר API calls
- **Error Handling** מקיף עם לוגים מפורטים
- **Health Checks** לניטור תקינות השירות

### 🌐 API מתקדם

- **Swagger Documentation** אוטומטית
- **Validation** מתקדם עם class-validator
- **Pagination** ו-filtering במחזור API
- **CORS** מוגדר לפי סביבה

## 📋 דרישות מערכת

- **Node.js** 18+
- **PostgreSQL** 15+
- **Docker** (אופציונלי)
- **Redis** (לcaching - אופציונלי)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Evyatar-Hazan/Lev-Hedva-server.git
cd Lev-Hedva-server
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. Start development server:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000` and documentation at `http://localhost:3000/api/docs`.

### Docker Development

```bash
docker-compose up -d
```

This starts PostgreSQL, Redis, Adminer, and the application.

## Project Structure

```
src/
├── modules/           # Feature modules
├── common/           # Shared utilities
│   ├── guards/       # Authorization guards
│   ├── decorators/   # Custom decorators
│   ├── filters/      # Exception filters
│   ├── interceptors/ # Request/response interceptors
│   └── dto/          # Data transfer objects
├── prisma/           # Database schema and migrations
├── test/             # E2E tests
└── .github/          # CI/CD workflows
```

## API Modules

### Users Module

- User management (CRUD)
- Role assignment
- Permission management
- User search and filtering

### Products Module

- Product catalog management
- Product instance tracking
- Barcode generation and scanning
- Inventory management

### Loans Module

- Equipment lending system
- Return tracking
- Overdue notifications
- Loan history

### Volunteers Module

- Volunteer activity tracking
- Hours logging
- Activity reports
- Volunteer management

### Authentication Module

- JWT token-based authentication
- Refresh token mechanism
- Role-based access control
- Session management

### Audit Module

- System-wide activity logging
- Change tracking
- User action history
- Compliance reporting

## API Documentation

Interactive API documentation is available at `/api/docs` when running in development mode.

## Database Schema

The application uses the following main entities:

- **Users**: System users with roles (Admin, Worker, Volunteer, Client)
- **Products**: Equipment catalog
- **ProductInstances**: Physical items with unique barcodes
- **Loans**: Borrowing transactions
- **VolunteerActivities**: Volunteer work tracking
- **Permissions**: Dynamic permission system
- **AuditLogs**: System activity logs
- **Sessions**: User session management

## Scripts

- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run start:dev` - Start development server
- `npm run start:debug` - Start debug server
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run test:cov` - Generate coverage report
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with initial data

## Environment Variables

Key environment variables:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/database
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
REDIS_URL=redis://localhost:6379
```

## Deployment

### Google Cloud Run

The application is configured for Google Cloud Run deployment:

1. Build and push Docker image:

```bash
docker build -t gcr.io/PROJECT_ID/lev-hedva-server .
docker push gcr.io/PROJECT_ID/lev-hedva-server
```

2. Deploy to Cloud Run:

```bash
gcloud run deploy lev-hedva-server \
  --image gcr.io/PROJECT_ID/lev-hedva-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### CI/CD

GitHub Actions workflows are configured for:

- Automated testing on pull requests
- Docker image building
- Deployment to Google Cloud Run
- Code quality checks

## Security

- **Authentication**: JWT tokens with secure secret keys
- **Authorization**: Role-based access control with dynamic permissions
- **Input Validation**: Comprehensive request validation using class-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configured cross-origin resource sharing
- **Password Hashing**: Argon2 for secure password storage

## Testing

The application includes comprehensive testing:

- **Unit Tests**: Individual component testing
- **Integration Tests**: Module interaction testing
- **E2E Tests**: Full application flow testing
- **Coverage**: Aim for 90%+ code coverage

Run tests:

```bash
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage report
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
