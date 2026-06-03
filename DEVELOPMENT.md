# Monorepo Development Guide

## 🚀 First Time Setup

### Prerequisites
- Node.js 18+ 
- pnpm 9+

### Installation

```bash
# 1. Navigate to monorepo
cd /Users/evyatarhazan/Desktop/project/Evyatar

# 2. Install pnpm if not already installed
npm install -g pnpm

# 3. Install all dependencies
pnpm install

# 4. (Optional) Install Turbo CLI globally
pnpm add -g turbo
```

## 📦 Development Commands

### Running All Projects
```bash
pnpm dev              # Start all apps in dev mode (recommended)
pnpm build            # Build all projects
pnpm lint             # Lint all projects
pnpm format           # Format all code
pnpm test             # Run all tests
pnpm type-check       # Type check all projects
pnpm clean            # Clean all build artifacts
```

### Working with Specific Projects

```bash
# Run specific app in dev
pnpm --filter web-portfolio dev
pnpm --filter lev-hedva-api dev

# Build specific app
pnpm --filter web-portfolio build

# Add dependency to specific app
pnpm --filter web-portfolio add axios
pnpm --filter web-portfolio add -D @types/node

# Add dependency to root (for shared dev tools)
pnpm add -D -w turbo
```

### Using Turbo Commands

```bash
# Run build with caching
turbo run build

# Run specific task in parallel
turbo run dev --parallel

# Run task only for changed apps
turbo run build --since origin/main

# Run task with output streaming
turbo run lint -- --force
```

## 📁 Project Structure

```
.
├── apps/
│   ├── frontend/              # React applications
│   │   ├── web-portfolio      # Main portfolio (Vite)
│   │   ├── lev-chedva-website # Website (Vite)
│   │   ├── emergency-protocol-diagram
│   │   ├── online-converter
│   │   ├── hebrew-schedule    # Legacy CRA
│   │   ├── test-yourself      # Legacy CRA
│   │   └── lev-chedva-admin   # Admin dashboard
│   │
│   └── backend/               # Node.js servers
│       ├── emergency-protocol-server
│       ├── uh-shoham-server
│       ├── test-yourself-api
│       └── lev-hedva-api      # NestJS
│
├── packages/
│   ├── shared-types/          # Shared TypeScript types
│   └── shared-utils/          # Shared utilities
│
├── configs/
│   ├── typescript/            # Shared TypeScript config
│   └── eslint/                # Shared ESLint config
│
└── [Root files]
    ├── package.json           # Root package.json
    ├── turbo.json             # Turborepo config
    ├── pnpm-workspace.yaml    # pnpm workspaces
    └── README.md
```

## 🔗 Using Shared Packages

### shared-types

```typescript
// In any frontend or backend app
import type { ApiResponse, User, PaginatedResponse } from '@monorepo/shared-types';

const response: ApiResponse<User> = {
  success: true,
  data: { id: '1', email: 'user@example.com' }
};
```

### shared-utils

```typescript
import { capitalize, formatDate, chunk, pick } from '@monorepo/shared-utils';

const title = capitalize('hello'); // 'Hello'
const formatted = formatDate(new Date());
```

## 📝 Adding New Projects

### 1. Create folder

```bash
mkdir apps/frontend/my-new-app
cd apps/frontend/my-new-app
```

### 2. Create package.json

```json
{
  "name": "my-new-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist .turbo",
    "format": "prettier --write src"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}
```

### 3. Install from root

```bash
cd /path/to/monorepo
pnpm install
```

## ⚙️ Configuration Files

### tsconfig.json in apps
Reference shared configs:

```json
{
  "extends": "../../configs/typescript/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["dist", "build"]
}
```

### .eslintrc.js in apps

```javascript
export default [
  {
    ignores: ['dist', '.turbo', 'node_modules']
  },
  // ... custom rules
];
```

## 🔄 Dependency Management

### pnpm Features
- **Workspace**: Automatic linking between local packages
- **Phantom dependencies**: Strict mode prevents accessing transitive deps
- **Storage**: Efficient hard-linked node_modules

### Common Tasks

```bash
# List workspaces
pnpm list --depth 0

# Check dependency tree
pnpm list axios

# Remove unused packages
pnpm prune

# Update lockfile
pnpm install --lockfile-only
```

## 🐛 Troubleshooting

### "Cannot find module" errors

```bash
# Clear cache and reinstall
pnpm clean
pnpm install
```

### Turbo cache issues

```bash
# Clear turbo cache
rm -rf .turbo
pnpm build  # Rebuild from scratch
```

### Port conflicts in dev

Each app uses a different default port:
- web-portfolio: 5173
- lev-chedva-website: 5174
- emergency-protocol-diagram: 5175
- online-converter: 5176
- hebrew-schedule: 3000
- test-yourself: 3001
- lev-chedva-admin: 3002

Override with:
```bash
pnpm --filter web-portfolio dev -- --port 5000
```

## 📚 Resources

- [Turborepo Docs](https://turbo.build)
- [pnpm Docs](https://pnpm.io)
- [Monorepo Best Practices](https://turbo.build/repo/docs/handbook)

## 🆘 Need Help?

Check individual app READMEs for app-specific instructions.
