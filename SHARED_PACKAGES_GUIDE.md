# 📦 Shared Packages Usage Guide

## Overview

The monorepo includes two shared packages that all backend projects should use:

- **@monorepo/shared-types** - Common TypeScript interfaces and types
- **@monorepo/shared-utils** - Utility functions used across projects

## Available Types (@monorepo/shared-types)

### API Response Types

```typescript
import { ApiResponse, PaginatedResponse } from '@monorepo/shared-types';

// Standard API response
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Paginated response
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

### Common Types

```typescript
import {
  User,
  AuthToken,
  ErrorResponse,
  PaginationParams,
} from '@monorepo/shared-types';

// User interface
interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Auth token
interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}
```

## Available Utils (@monorepo/shared-utils)

### String Utilities

```typescript
import { capitalize, slugify } from '@monorepo/shared-utils';

capitalize('hello world'); // "Hello world"
slugify('Hello World!'); // "hello-world"
```

### Number Utilities

```typescript
import { formatNumber, clamp } from '@monorepo/shared-utils';

formatNumber(3.14159, 2); // "3.14"
clamp(5, 1, 3); // 3
```

### Date Utilities

```typescript
import { formatDate, formatTime } from '@monorepo/shared-utils';

const date = new Date();
formatDate(date); // "6/3/2026"
formatTime(date); // "16:45:23"
```

### Array Utilities

```typescript
import { chunk, unique } from '@monorepo/shared-utils';

chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
unique([1, 2, 2, 3, 3, 3]); // [1, 2, 3]
```

### Object Utilities

```typescript
import { pick, omit } from '@monorepo/shared-utils';

const user = { id: '1', name: 'John', email: 'john@example.com' };
pick(user, ['id', 'name']); // { id: '1', name: 'John' }
omit(user, ['email']); // { id: '1', name: 'John' }
```

## Usage Examples

### NestJS Backend

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiResponse, PaginatedResponse } from '@monorepo/shared-types';
import { formatTime } from '@monorepo/shared-utils';

@Controller('api')
export class ApiController {
  @Get('health')
  async getHealth(): Promise<ApiResponse> {
    const now = new Date();
    
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: formatTime(now),
      },
      message: 'Service is running',
    };
  }

  @Get('users')
  async getUsers(): Promise<PaginatedResponse<User>> {
    // ... fetch users
    
    return {
      items: users,
      total: 100,
      page: 1,
      limit: 10,
      hasMore: true,
    };
  }
}
```

### Express Backend

```typescript
import { ApiResponse } from '@monorepo/shared-types';
import { capitalize, clamp } from '@monorepo/shared-utils';

app.get('/api/health', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Service is ' + capitalize('healthy'),
  };
  res.json(response);
});
```

## How Types and Utils Are Shared

1. **Workspace Configuration**: Both `package.json` files declare:
   ```json
   "workspaces": ["apps/frontend/*", "apps/backend/*", "packages/*"]
   ```

2. **TypeScript Paths**: Root `tsconfig.json` includes:
   ```json
   "paths": {
     "@monorepo/shared-types": ["packages/shared-types/src/index.ts"],
     "@monorepo/shared-utils": ["packages/shared-utils/src/index.ts"]
   }
   ```

3. **Package Dependencies**: Each backend has:
   ```json
   "dependencies": {
     "@monorepo/shared-types": "workspace: *",
     "@monorepo/shared-utils": "workspace: *"
   }
   ```

## How to Build and Test

### Build Specific Package
```bash
pnpm --filter @monorepo/shared-types build
pnpm --filter @monorepo/shared-utils build
```

### Type Check All Projects
```bash
pnpm type-check
```

### Type Check Specific Backend
```bash
pnpm --filter @monorepo/lev-hedva-api type-check
```

### Build All
```bash
pnpm build
```

## Adding New Types or Utils

### Adding a New Type

1. Edit `packages/shared-types/src/index.ts`:
   ```typescript
   export interface MyNewType {
     // properties
   }
   ```

2. All backends can immediately import it:
   ```typescript
   import { MyNewType } from '@monorepo/shared-types';
   ```

### Adding a New Utility Function

1. Edit `packages/shared-utils/src/index.ts`:
   ```typescript
   export const myUtilFunction = (param: string): string => {
     // implementation
   };
   ```

2. Use in any backend:
   ```typescript
   import { myUtilFunction } from '@monorepo/shared-utils';
   ```

## Real-World Example: lev-hedva-api

The `@monorepo/lev-hedva-api` backend demonstrates shared package usage:

- Uses `ApiResponse` type from `@monorepo/shared-types` in `src/app.service.ts`
- Uses `formatTime` utility from `@monorepo/shared-utils` for formatting timestamps
- Uses `PaginatedResponse` type for list endpoints
- Uses `clamp` utility in business logic

## Benefits of Shared Packages

✅ **Type Safety**: Consistent interfaces across all projects  
✅ **Code Reuse**: Avoid duplicating utility functions  
✅ **Maintainability**: Update once, used everywhere  
✅ **Consistency**: All APIs follow the same response format  
✅ **Development Speed**: Common patterns are pre-built  

## Troubleshooting

### Import Not Working

If you get "Cannot find module '@monorepo/shared-types'":

1. Check `pnpm install` has run: `pnpm install`
2. Verify `package.json` has dependency: 
   ```json
   "@monorepo/shared-types": "workspace: *"
   ```
3. Rebuild TypeScript declarations:
   ```bash
   pnpm build --filter @monorepo/shared-types
   ```

### Type Errors After Adding to Shared Packages

Run type-check to catch issues early:
```bash
pnpm type-check
```

### Import Not Intellisensed in IDE

Rebuild TypeScript declarations:
```bash
pnpm --filter @monorepo/shared-types build
pnpm --filter @monorepo/shared-utils build
```

Then restart VS Code's TypeScript server (Cmd+Shift+P → "TypeScript: Restart TS Server").
