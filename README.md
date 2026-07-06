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

- Node 20.x
- pnpm 9.15.9
- Turborepo
- React 19
- Vite
- TypeScript
- Vitest
- ESLint

## Commands

```bash
volta install node@20.19.0 pnpm@9.15.9
corepack enable
corepack use pnpm@9.15.9
pnpm doctor:runtime
pnpm install --frozen-lockfile
pnpm dev
pnpm validate
pnpm type-check
pnpm lint
pnpm media:check
pnpm media:optimize
pnpm test
pnpm build
```

## Local And CI Parity

- Use Node `20.x` locally to match GitHub Actions and the app-level engine contract.
- The repo is pinned with Volta to `Node 20.19.0` and `pnpm 9.15.9`.
- Run `pnpm doctor:runtime` before local work if you want a fail-fast runtime check.
- Use the repo-pinned pnpm version with `corepack use pnpm@9.15.9`.
- Treat `pnpm validate` as the single quality gate for both local verification and CI.

## App

The production website lives in `apps/frontend/nis-boutique-catering`.

## Documentation

- Full content pipeline and publishing flow: [docs/content-flow.md](/Users/evyatarhazan/Desktop/project/nis-boutique-catering/docs/content-flow.md)
- Studio setup and operations: [CONTENT_STUDIO.md](/Users/evyatarhazan/Desktop/project/nis-boutique-catering/CONTENT_STUDIO.md)

## Local Artifacts

`output/` is treated as a local-only artifact directory.

It may contain temporary screenshots or verification outputs created during local debugging, browser checks, or Playwright-style validation runs.

It is intentionally ignored by git and should not be used as a source of truth for the product, content, or deployment pipeline.

To run commands directly for the app:

```bash
pnpm --filter @monorepo/nis-boutique-catering dev
pnpm --filter @monorepo/nis-boutique-catering media:optimize
pnpm --filter @monorepo/nis-boutique-catering validate
pnpm --filter @monorepo/nis-boutique-catering perf:lighthouse
```
