# Emergency Protocol Diagram Server

A Node.js/Express backend server for the Emergency Protocol Diagram application with Google OAuth authentication and nested comments system.

## Features

- **Google OAuth 2.0 Authentication**: Users login with their Google accounts
- **Comments System**: Add, edit, delete, and reply to comments on protocol nodes
- **Nested Comments**: Support for comment threads and replies
- **Admin Dashboard**: Admin users can manage all comments
- **Role-Based Access**: Separate admin and regular user permissions
- **Type-Safe**: Built with TypeScript
- **Well-Tested**: Jest unit and integration tests
- **Code Quality**: ESLint, Prettier, and TypeScript strict mode

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Google OAuth 2.0
- **Testing**: Jest & Supertest
- **Linting**: ESLint
- **Formatting**: Prettier

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Google OAuth 2.0 credentials

## Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

3. Configure your `.env` file with:
   - `DATABASE_URL`: PostgreSQL connection string
   - `GOOGLE_CLIENT_ID`: From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
   - `JWT_SECRET`: Any secure random string
   - `ADMIN_EMAIL`: Your admin email (EvyatarHazan3.14@gmail.com by default)

4. Set up the database:

```bash
npm run prisma:migrate
npm run prisma:seed
```

## Development

Start the development server:

```bash
npm run dev
```

The server will run on `http://localhost:5000`

## Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Code Quality

Check for linting errors:

```bash
npm run lint
```

Fix linting errors:

```bash
npm run lint:fix
```

Format code:

```bash
npm run format
```

## Building

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/google-login` - Login with Google ID token
- `GET /api/auth/me` - Get current user info (requires auth)

### Comments

- `GET /api/comments/:nodeId` - Get all comments for a protocol node
- `POST /api/comments` - Create a new comment (requires auth)
- `PUT /api/comments/:commentId` - Update a comment (own comment or admin)
- `DELETE /api/comments/:commentId` - Delete a comment (own comment or admin)

## Database Schema

### User

- `id`: Unique identifier
- `email`: User email (unique)
- `googleId`: Google OAuth ID (unique)
- `name`: User's name
- `picture`: User's profile picture
- `isAdmin`: Admin flag
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Comment

- `id`: Unique identifier
- `nodeId`: Protocol node ID (e.g., "asthma_attack")
- `content`: Comment text
- `authorId`: User ID (foreign key)
- `parentCommentId`: Parent comment ID for nested replies
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## Deployment

### Deploy to Render

1. Push code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Set environment variables in Render dashboard
5. Deploy

Environment variables needed on Render:
- `DATABASE_URL`: Render PostgreSQL connection string
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth secret
- `JWT_SECRET`: Your JWT secret key
- `FRONTEND_URL`: Your deployed frontend URL

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

## Security

- CORS enabled for configured frontend URL only
- Helmet.js for HTTP headers security
- JWT token-based authentication
- Google OAuth verification
- Input validation with express-validator
- SQL injection prevention via Prisma

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Ensure all tests pass before submitting PR
4. Use semantic commit messages

## License

MIT
