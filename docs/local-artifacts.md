# Local Artifacts Contract

`output/` is the repository's local-only artifacts directory.

It exists for disposable verification outputs created during local work, for example:

- browser screenshots
- Playwright capture outputs
- temporary visual diff evidence
- one-off verification files that should not become source of truth

## What `output/` Is Not

`output/` must not be used for:

- product source files
- generated content that is required by production
- deploy inputs
- content publishing state
- CI handoff files
- any file another script silently depends on

If a file is required for build, publish, preview, or runtime behavior, it belongs in a versioned location such as:

- `apps/**/src`
- `apps/**/public`
- `apps/**/generated`
- `apps/**/reports`
- `docs/`

## Operational Rules

- Git ignores `output/` completely.
- CI and Cloudflare deploys must succeed without anything inside `output/`.
- Files inside `output/` are safe to delete at any time.
- Preferred subfolders should describe the producer, for example `output/playwright/`.

## Commands

List current local artifacts:

```bash
npx pnpm@9.15.9 artifacts:list
```

Delete all local artifacts:

```bash
npx pnpm@9.15.9 artifacts:clean
```

## Decision

As of July 8, 2026, the repo keeps `output/` as a sanctioned local-only artifact directory instead of promoting it into the build or deploy pipeline.
