# Nis

Hebrew RTL landing page for Nis, with boutique catering as the service subtitle.

## Structure

```text
src/
  components/   Page sections and site chrome
  data/         Static business content and media references
  hooks/        UI behavior hooks
  styles/       Base styles and theme layer
  test/         Vitest setup
  utils/        Small shared helpers
```

## Quality Notes

- `App.tsx` stays thin and composes the page from smaller sections.
- Accessibility checks run through ESLint with `eslint-plugin-jsx-a11y`.
- Smoke tests cover hero render, gallery filtering, lightbox behavior, keyboard tab navigation, contact form submit composition, and the mobile sticky CTA.
- `validate` runs the local quality gate in one pass: type-check, lint, media checks, test, and production build.
- Media workflow details live in [`MEDIA.md`](./MEDIA.md).

## Temporary V1 Data

- Business email: `nisboutiquecatering@gmail.com`
- Phone and WhatsApp are derived from the single canonical value in `packages/content-schema/src/contact.ts`.
- Activity area: Beitar Illit and nearby areas by coordination
- Minimum order: decided per inquiry
- Lead time: contact as early as possible
- Images: local Nis food and hosting media under `public/media/food`
- Responsive media: generated AVIF/WebP variants are checked by `pnpm media:check`
- Analytics: placeholders only, not connected yet

## Commands

```bash
pnpm --filter @monorepo/nis-boutique-catering dev
pnpm --filter @monorepo/nis-boutique-catering type-check
pnpm --filter @monorepo/nis-boutique-catering lint
pnpm --filter @monorepo/nis-boutique-catering content:check
pnpm --filter @monorepo/nis-boutique-catering media:check
pnpm --filter @monorepo/nis-boutique-catering test
pnpm --filter @monorepo/nis-boutique-catering build
pnpm --filter @monorepo/nis-boutique-catering validate
pnpm --filter @monorepo/nis-boutique-catering perf:lighthouse
```
