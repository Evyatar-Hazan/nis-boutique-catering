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
- `validate` runs the local quality gate in one pass: type-check, lint, test, and production build.

## Temporary V1 Data

- Business email: `nisboutiquecatering@gmail.com`
- Phone and WhatsApp: `050-3502615`
- Activity area: Beitar Illit and nearby areas by coordination
- Minimum order: decided per inquiry
- Lead time: contact as early as possible
- Images: local Nis food and hosting media under `public/media/food`
- Analytics: placeholders only, not connected yet

## Commands

```bash
pnpm --filter @monorepo/nis-boutique-catering dev
pnpm --filter @monorepo/nis-boutique-catering type-check
pnpm --filter @monorepo/nis-boutique-catering lint
pnpm --filter @monorepo/nis-boutique-catering test
pnpm --filter @monorepo/nis-boutique-catering build
pnpm --filter @monorepo/nis-boutique-catering validate
```
