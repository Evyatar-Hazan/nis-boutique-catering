# Media Workflow

This app serves brand, food, and event media from `public/` so public URLs stay stable:

- Brand assets: `public/brand`
- Food and event media: `public/media/food`
- Event gallery images: `public/media/food/events`

Image metadata lives in `src/data/siteContent.ts`. Every image used by React should be registered as an `ImageAsset` with:

- `src`: public URL, starting with `/`
- `width` and `height`: source pixel dimensions
- `sizes`: browser layout hint
- `responsive: true`: generate and render responsive AVIF/WebP variants

## Add Or Replace An Image

1. Put the original source file under `public/media/food` or `public/media/food/events`.
2. Use a descriptive, stable filename: `subject-context-detail.webp`.
3. Add or update the matching `ImageAsset` in `src/data/siteContent.ts`.
4. Run:

```sh
pnpm media:optimize
pnpm media:check
```

5. Use the asset through `OptimizedImage`, not a raw `<img>`, unless the file is a favicon or external metadata image.

## Cache Strategy

Files in `public/` are served by filename. If a visual changes materially, prefer a new filename instead of replacing the file behind an existing URL. This avoids stale browser/CDN cache while keeping predictable static hosting.

Good:

```txt
salmon-skewers-lemon.webp
salmon-skewers-lemon-v2.webp
```

Avoid reusing a filename when the visible content changed substantially.

## Generated Variants

`pnpm media:optimize` creates responsive variants next to the source image:

- WebP: `*-720w.webp`, `*-1200w.webp`, and full-width WebP when the source is not already WebP.
- AVIF: `*-720w.avif`, `*-1200w.avif`, and full-width AVIF.

The app renders responsive images through `<picture>` so modern browsers choose AVIF first, then WebP, then the source fallback.

## Quality Gate

`pnpm validate` includes `pnpm media:check`. The check fails when:

- a registered source file is missing
- a responsive variant is missing
- `index.html` points to a missing image or preload candidate

