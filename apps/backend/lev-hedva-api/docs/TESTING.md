# Testing Infrastructure Documentation

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Enforcement](#test-enforcement)
- [Code Coverage](#code-coverage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project implements a **comprehensive, production-grade testing infrastructure** with:

- ✅ **Unit Tests** - Isolated testing of business logic
- ✅ **Integration Tests** - End-to-end API testing
- ✅ **Automated Test Enforcement** - Pre-commit and pre-push hooks
- ✅ **Code Coverage Thresholds** - Minimum 80% coverage required
- ✅ **Test Factories & Helpers** - Reusable test utilities
- ✅ **Mock Services** - Isolated and deterministic tests

### Technology Stack

- **Testing Framework**: Jest 30.x
- **Test Runner**: ts-jest
- **E2E Testing**: Supertest
- **Git Hooks**: Husky 9.x
- **Coverage Tool**: Istanbul (built into Jest)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run All Tests

```bash
npm test
```

### 3. Run Tests with Coverage

```bash
npm run test:cov
```

### 4. Run Tests in Watch Mode (Development)

```bash
npm run test:watch
```

---

## Test Types

### Unit Tests

**Location**: `src/**/*.spec.ts`

**Purpose**: Test individual services, classes, and functions in isolation.

**Characteristics**:

- No database connections
- All dependencies are mocked
- Fast execution (< 1 second per test)
- Deterministic results

**Example**:

```typescript
// src/modules/auth/auth.service.spec.ts
describe('AuthService', () => {
  it('should hash password with bcrypt', async () => {
    // Test implementation
  });
});
```

### Integration Tests (E2E)

**Location**: `test/integration/**/*.e2e-spec.ts`

**Purpose**: Test complete API endpoints with real database interactions.

**Characteristics**:

- Uses test database
- Tests full request/response cycle
- Validates authentication and authorization
- Tests cross-module interactions

**Example**:

```typescript
// test/integration/auth.e2e-spec.ts
describe('Auth API (e2e)', () => {
  it('POST /auth/login should return JWT token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
  });
});
```

---

## Running Tests

### All Available Commands

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests with coverage report
npm run test:cov

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests in debug mode
npm run test:debug

# Run tests for CI/CD (optimized for pipelines)
npm run test:ci

# Run both unit and integration tests sequentially
npm run test:all
```

### Running Specific Tests

```bash
# Run tests for a specific file
npm test -- auth.service.spec.ts

# Run tests matching a pattern
npm test -- --testPathPattern=auth

# Run only tests with specific name
npm test -- --testNamePattern="should login successfully"

# Run tests for changed files only
npm test -- --onlyChanged
```

---

## Writing Tests

### Test Structure

Follow the **Arrange-Act-Assert** pattern:

```typescript
it('should create a user successfully', async () => {
  // Arrange - Set up test data and mocks
  const createUserDto = { email: 'test@example.com', password: 'pass123' };
  prisma.user.create.mockResolvedValue(mockUser);

  // Act - Execute the function being tested
  const result = await service.create(createUserDto);

  // Assert - Verify the results
  expect(result).toHaveProperty('id');
  expect(result.email).toBe(createUserDto.email);
  expect(prisma.user.create).toHaveBeenCalledTimes(1);
});
```

### Using Test Factories

Test factories provide consistent mock data:

```typescript
import { UserFactory, ProductFactory } from '../../../test/factories';

it('should return user by ID', async () => {
  const mockUser = UserFactory.create({ id: '123' });
  prisma.user.findUnique.mockResolvedValue(mockUser);

  const result = await service.findOne('123');
  expect(result.id).toBe('123');
});
```

### Available Factories

- `UserFactory` - Create mock users (admin, client, volunteer, worker)
- `ProductFactory` - Create mock products
- `ProductInstanceFactory` - Create mock product instances
- `LoanFactory` - Create mock loans (active, returned, overdue)
- `VolunteerActivityFactory` - Create mock volunteer activities
- `AuditLogFactory` - Create mock audit logs
- `PermissionFactory` - Create mock permissions

### Using Test Helpers

```typescript
import {
  createMockPrismaService,
  createMockAuditService,
  createMockJwtService,
  dateInPast,
  dateInFuture,
} from '../../../test/helpers/test-utils';

// Create mock services
const prisma = createMockPrismaService();
const auditService = createMockAuditService();

// Create test dates
const yesterday = dateInPast(1);
const nextWeek = dateInFuture(7);
```

### Testing Async Functions

```typescript
it('should handle async operations', async () => {
  mockService.someAsyncMethod.mockResolvedValue(expectedResult);

  const result = await service.methodUnderTest();

  expect(result).toBe(expectedResult);
});
```

### Testing Error Scenarios

```typescript
it('should throw NotFoundException when user not found', async () => {
  prisma.user.findUnique.mockResolvedValue(null);

  await expect(service.findOne('non-existent-id')).rejects.toThrow(
    NotFoundException
  );
});
```

### Testing with Multiple Scenarios

```typescript
describe('input validation', () => {
  it.each([
    ['empty email', { email: '', password: 'pass' }],
    ['invalid email', { email: 'not-email', password: 'pass' }],
    ['short password', { email: 'test@example.com', password: '12' }],
  ])('should reject %s', async (_, invalidDto) => {
    await expect(service.create(invalidDto)).rejects.toThrow();
  });
});
```

---

## Test Enforcement

### Git Hooks

Tests are **automatically enforced** before commits and pushes via Husky Git hooks.

#### Pre-Commit Hook

**Location**: `.husky/pre-commit`

**Runs**:

1. Tests on changed files only
2. ESLint on all staged files

**Execution Time**: ~5-15 seconds

**What happens if it fails**:

```bash
❌ Tests failed. Commit aborted.
💡 Fix the failing tests or use 'git commit --no-verify' to bypass (not recommended)
```

#### Pre-Push Hook

**Location**: `.husky/pre-push`

**Runs**:

1. Full test suite
2. Code coverage check (must meet 80% threshold)

**Execution Time**: ~30-60 seconds

**What happens if it fails**:

```bash
❌ Tests or coverage check failed. Push aborted.
💡 Ensure all tests pass and coverage meets the 80% threshold.
💡 Use 'git push --no-verify' to bypass (strongly discouraged)
```

### Bypassing Hooks (Emergency Only)

⚠️ **Only use in emergencies** (e.g., critical hotfix, CI/CD is broken)

```bash
# Bypass pre-commit
git commit --no-verify -m "Emergency fix"

# Bypass pre-push
git push --no-verify
```

**Important**: Always fix and commit the tests immediately after using `--no-verify`.

---

## Code Coverage

### Coverage Requirements

The project enforces **minimum 80% coverage** for:

- **Branches** - 80%
- **Functions** - 80%
- **Lines** - 80%
- **Statements** - 80%

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:cov

# Open HTML coverage report in browser
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

### Coverage Report Structure

```
coverage/
├── lcov-report/         # HTML coverage report
│   └── index.html       # Main coverage page
├── coverage-final.json  # JSON coverage data
└── lcov.info            # LCOV format (for CI tools)
```

### Excluded from Coverage

The following files are excluded from coverage calculations:

- `*.module.ts` - NestJS modules
- `*.dto.ts` - Data Transfer Objects
- `*.interface.ts` - TypeScript interfaces
- `main.ts` - Application entry point
- `*.spec.ts` - Test files themselves

---

## Best Practices

### 1. Test Naming

Use descriptive test names that explain **what** is being tested and **what** the expected outcome is:

```typescript
// ✅ Good
it('should return 401 when user provides incorrect password', async () => {});

// ❌ Bad
it('should fail', async () => {});
```

### 2. Test Independence

Each test should be **completely independent** and not rely on the execution order:

```typescript
// ✅ Good - Each test sets up its own data
describe('UserService', () => {
  it('should create user', async () => {
    const mockUser = UserFactory.create();
    // Test implementation
  });

  it('should delete user', async () => {
    const mockUser = UserFactory.create(); // Independent setup
    // Test implementation
  });
});
```

### 3. Mock External Dependencies

Always mock external dependencies (database, APIs, file system):

```typescript
// ✅ Good
const prisma = createMockPrismaService();
prisma.user.findUnique.mockResolvedValue(mockUser);

// ❌ Bad - Real database call
const user = await prisma.user.findUnique({ where: { id: '123' } });
```

### 4. Test Edge Cases

Don't just test the happy path:

```typescript
describe('createUser', () => {
  it('should create user with valid data', async () => {}); // Happy path
  it('should throw ConflictException for duplicate email', async () => {}); // Error case
  it('should handle database connection errors', async () => {}); // Infrastructure failure
  it('should validate email format', async () => {}); // Input validation
  it('should hash password securely', async () => {}); // Security
});
```

### 5. Keep Tests Fast

- Use mocks instead of real services
- Avoid unnecessary `setTimeout` or delays
- Run database operations in parallel when possible

```typescript
// ✅ Good - Parallel execution
const [users, total] = await Promise.all([
  prisma.user.findMany(),
  prisma.user.count(),
]);

// ❌ Bad - Sequential execution
const users = await prisma.user.findMany();
const total = await prisma.user.count();
```

### 6. Use `beforeEach` and `afterEach`

Clean up state between tests:

```typescript
describe('Service Tests', () => {
  let service: MyService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MyService,
        { provide: PrismaService, useFactory: createMockPrismaService },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks between tests
  });
});
```

### 7. Avoid Test Duplication

Use parameterized tests for similar scenarios:

```typescript
describe('email validation', () => {
  it.each(['invalid', '@example.com', 'test@', 'test @example.com'])(
    'should reject invalid email: %s',
    async (email) => {
      await expect(
        service.create({ email, password: 'pass' })
      ).rejects.toThrow();
    }
  );
});
```

---

## Troubleshooting

### Common Issues

#### 1. "Jest did not exit one second after the test run"

**Cause**: Open connections or timers not closed.

**Solution**:

```typescript
afterAll(async () => {
  await app.close(); // Close NestJS application
  await prisma.$disconnect(); // Close database connection
});
```

#### 2. "Cannot find module '@/...'"

**Cause**: Path alias not configured correctly.

**Solution**: Ensure `jest.config.cjs` has correct `moduleNameMapper`:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
},
```

#### 3. "Test timeout exceeded"

**Cause**: Async operation takes too long or never resolves.

**Solution**:

```typescript
it('should complete quickly', async () => {
  // Increase timeout for this test only
}, 15000);  // 15 seconds

// Or globally in jest.config.cjs
testTimeout: 10000,
```

#### 4. "Cannot spy on property X"

**Cause**: Trying to mock a non-function property.

**Solution**:

```typescript
// Use jest.spyOn for functions
jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed');

// Use Object.defineProperty for properties
Object.defineProperty(global, 'Date', {
  value: jest.fn(() => new Date('2025-01-01')),
});
```

#### 5. "Received: serializes to the same string"

**Cause**: Comparing objects that look the same but have different references.

**Solution**:

```typescript
// ✅ Use toEqual for deep object comparison
expect(result).toEqual({ id: '123', name: 'Test' });

// ❌ toBe only works for primitives
expect(result).toBe({ id: '123', name: 'Test' }); // Will fail
```

#### 6. "Mock function has been called with invalid arguments"

**Cause**: Mock called with unexpected parameters.

**Solution**: Check the actual calls:

```typescript
expect(mockService.create).toHaveBeenCalledWith(expectedDto);

// Debug what was actually called
console.log(mockService.create.mock.calls);
```

### Debugging Tests

#### Enable Verbose Output

```bash
npm test -- --verbose
```

#### Run Single Test File

```bash
npm test -- src/modules/auth/auth.service.spec.ts
```

#### Run in Debug Mode

```bash
npm run test:debug
```

Then attach a debugger (VS Code, Chrome DevTools) to `node --inspect-brk` process.

#### Check What Tests Will Run

```bash
npm test -- --listTests
```

### Getting Help

1. **Check error message carefully** - Jest provides detailed stack traces
2. **Read test output** - Look for expected vs actual values
3. **Check mock calls** - Use `mockFn.mock.calls` to debug
4. **Simplify the test** - Remove complexity to isolate the issue
5. **Review similar tests** - Look at working tests for patterns

---

## Continuous Integration

### GitHub Actions / GitLab CI Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:ci

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Summary

✅ **All code must be tested** before commit and push
✅ **80% code coverage** is enforced
✅ **Tests run automatically** via Git hooks
✅ **Fast feedback loop** with watch mode
✅ **Comprehensive test utilities** available

**Remember**: Tests are not optional - they are a critical part of the development process!
