# Nis boutique catering

Monorepo dedicated to the Nis boutique catering website.

## Structure

```text
.
├── apps/
│   └── frontend/
│       └── nis-boutique-catering/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## Tech Stack

- pnpm 9.15.9
- Turborepo
- React 19
- Vite
- TypeScript
- Vitest
- ESLint

## Commands

```bash
pnpm install
pnpm dev
pnpm type-check
pnpm lint
pnpm media:check
pnpm media:optimize
pnpm test
pnpm build
```

## App

The production website lives in `apps/frontend/nis-boutique-catering`.

To run commands directly for the app:

```bash
pnpm --filter @monorepo/nis-boutique-catering dev
pnpm --filter @monorepo/nis-boutique-catering media:optimize
pnpm --filter @monorepo/nis-boutique-catering validate
pnpm --filter @monorepo/nis-boutique-catering perf:lighthouse
```
