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

- Node 24.x
- pnpm 9.15.9
- Turborepo
- React 19
- Vite
- TypeScript
- Vitest
- ESLint

## Commands

```bash
volta install node@24.11.0 pnpm@9.15.9
corepack enable
corepack use pnpm@9.15.9
pnpm doctor:runtime
pnpm install --frozen-lockfile
pnpm parity:local
pnpm dev
pnpm validate
pnpm type-check
pnpm lint
pnpm media:check
pnpm media:optimize
pnpm artifacts:list
pnpm artifacts:clean
pnpm test
pnpm build
```

## Local And CI Parity

- Use Node `24.x` locally to match GitHub Actions and the app-level engine contract.
- The repo is pinned with Volta to `Node 24.11.0` and `pnpm 9.15.9`.
- Run `pnpm doctor:runtime` before local work if you want a fail-fast runtime check.
- Use the repo-pinned pnpm version with `corepack use pnpm@9.15.9`.
- Treat `pnpm validate` as the single quality gate for both local verification and CI.
- Run `pnpm parity:local` to mirror the CI validate job locally with the same runtime, frozen lockfile install, and workspace gate.
- Run `pnpm parity:local:deploy` to mirror the deploy workflow build path locally. It fails fast if the same Google and Studio env values used in CI are missing.

## App

The production website lives in `apps/frontend/nis-boutique-catering`.

## Documentation

- Full content pipeline and publishing flow: [docs/content-flow.md](/Users/evyatarhazan/Desktop/project/nis-boutique-catering/docs/content-flow.md)
- Studio setup and operations: [CONTENT_STUDIO.md](/Users/evyatarhazan/Desktop/project/nis-boutique-catering/CONTENT_STUDIO.md)
- Local parity env template: [.env.example](/Users/evyatarhazan/Desktop/project/nis-boutique-catering/.env.example)

## Local Artifacts

`output/` is treated as a local-only artifact directory.

It may contain temporary screenshots or verification outputs created during local debugging, browser checks, or Playwright-style validation runs.

It is intentionally ignored by git and should not be used as a source of truth for the product, content, or deployment pipeline.

The contract for `output/`, including allowed uses and cleanup commands, lives in [docs/local-artifacts.md](/Users/evyatarhazan/Desktop/project/nis-boutique-catering/docs/local-artifacts.md).

Quick commands:

```bash
pnpm artifacts:list
pnpm artifacts:clean
```

To run commands directly for the app:

```bash
pnpm --filter @monorepo/nis-boutique-catering dev
pnpm --filter @monorepo/nis-boutique-catering media:optimize
pnpm --filter @monorepo/nis-boutique-catering validate
pnpm --filter @monorepo/nis-boutique-catering perf:lighthouse
```
