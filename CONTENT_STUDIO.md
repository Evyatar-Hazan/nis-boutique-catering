# Nis Content Studio

Content Studio is a private admin app for managing the public Nis site with free Google tools:

- Google Sheets stores structured content.
- Google Drive stores source images.
- The frontend build syncs content into committed/static files and generates fast media assets.
- Cloudflare Pages publishes the public site and the admin studio from GitHub.

## Workspace

- Admin app: `apps/admin/nis-content-studio`
- Shared schema: `packages/content-schema`
- Public site sync scripts: `apps/frontend/nis-boutique-catering/scripts/sync-content.mjs`
- Fallback content: `apps/frontend/nis-boutique-catering/content/fallback-content.json`
- Generated public content: `apps/frontend/nis-boutique-catering/src/generated/siteContent.generated.ts`
- Preview parity skill: `PREVIEW_PARITY_SKILL.md`

## Studio Preview Rule

Studio previews for real public-site sections must follow the project preview-parity skill in [PREVIEW_PARITY_SKILL.md](/Users/evyatarhazan/Desktop/project/nis-boutique-catering/PREVIEW_PARITY_SKILL.md).

Short version:

- render the real site component
- use the real site CSS
- use a real viewport, usually through `iframe`
- visually compare Studio vs site before calling the task done

## Google Sheet Tabs

Create these tabs with the exact header rows:

```txt
site_settings
key | value

media
id | src | width | height | sizes | responsive | driveFileId | usageNotes

gallery
id | title | alt | category | order | active | tall | mediaId | driveFileId | notes

services
id | title | subtitle | description | bestFor | promise | details | cta | mediaId | icon

sections
id | group | title | text | items | active
```

Use `|` inside `details` and `items` cells for multiple values.

## Public Site Mapping

The public site currently consumes generated content from these Sheet areas:

- `site_settings`: phone, email, WhatsApp, SEO title/description, and footer version.
- `media` + `gallery`: gallery images, active state, ordering, layout, alt text, and static CMS assets.
- `services`: service cards when the sheet has valid rows; otherwise the committed fallback services are used.
- `sections`: `id=hero` controls the hero eyebrow/title/kicker/text. `id=hero-media` stores the hero image media IDs in this order: background, primary, side, tall. Rows with `group=faq` become FAQ items. Other groups are stored and editable for gradual rollout.

For Drive-backed media, the production build normalizes `src` to `/media/cms/<asset-id>.webp` and generates static files from the Drive source.

## Admin Env

Set these for `apps/admin/nis-content-studio`:

```sh
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_API_KEY=
VITE_GOOGLE_SHEET_ID=
VITE_GOOGLE_DRIVE_FOLDER_ID=
VITE_GOOGLE_APPS_SCRIPT_PUBLISH_URL=
VITE_ALLOWED_EDITORS=owner@example.com
```

Run:

```sh
npx pnpm@9.15.9 admin:dev
```

Without env, the admin opens in demo mode and does not write to Google.

## Public Site Build Env

For Cloudflare Pages / GitHub Actions build-time sync:

```sh
GOOGLE_SHEET_ID=
GOOGLE_SERVICE_ACCOUNT_JSON=
CONTENT_SYNC_REQUIRE_REMOTE=true
```

`GOOGLE_SERVICE_ACCOUNT_JSON` should be the full service-account JSON string. Share the Google Sheet and Drive media folder with the service account email.

Build command for the public site should run:

```sh
npx pnpm@9.15.9 cloudflare:build:site
```

Local development can omit Google env and `content:sync` will fall back to committed content. The production Cloudflare workflow sets `CONTENT_SYNC_REQUIRE_REMOTE=true`, so production deploys fail instead of silently publishing stale fallback content.

When remote sync succeeds, `public/media/cms` is rebuilt from Drive. Source images are downloaded into a temporary `_source` folder and converted into static WebP variants, so the public site does not serve Drive URLs or original image metadata.

## Seeding Sheets

The committed fallback content can be used to initialize or reset the managed Sheet tabs:

```sh
npx pnpm@9.15.9 content:seed
```

This requires `GOOGLE_SHEET_ID` and `GOOGLE_SERVICE_ACCOUNT_JSON` with Sheets write access. It clears and rewrites only the managed tabs listed above, normalizes Drive-backed media to `/media/cms/<asset-id>.webp`, and keeps the public site on static optimized assets.

For production setup, use the manual GitHub Action `.github/workflows/seed-google-content.yml` with input `SEED`. It runs with the existing GitHub secret instead of exposing the service-account JSON locally.

## Content Flow

המסמך המלא והמחייב של זרימת התוכן נמצא כאן:

- [docs/content-flow.md](/Users/evyatarhazan/Desktop/project/nis-boutique-catering/docs/content-flow.md)

Short version:

1. Studio reads and writes structured content in Google Sheets.
2. Studio uploads source images to Google Drive and stores `driveFileId`.
3. `שמור טיוטה` persists only to Google, not to the live site.
4. `עדכן אתר` triggers Apps Script, which dispatches GitHub Actions.
5. The deploy workflow runs `content:sync`, generates static snapshot files and CMS media assets, builds both apps, and deploys to Cloudflare Pages.
6. The public site changes only after the deploy workflow succeeds and the live domain serves the new bundle.

Use the full document for:

- source-of-truth rules
- exact file ownership
- local vs production differences
- failure modes
- verification checklists
- maintenance rules

## Cloudflare Pages

The repository is designed for two Cloudflare Pages projects:

- Public site project: `nis-boutique-catering`
- Admin studio project: `nis-content-studio`

Both should use production branch `main`.

Recommended custom domains:

- Public site: `nisboutiquecatering.com`
- Admin studio: `studio.nisboutiquecatering.com`

The GitHub Action `.github/workflows/cloudflare-pages.yml` builds and deploys both projects on every push to `main`.

Required GitHub secret:

```txt
CLOUDFLARE_API_TOKEN
GOOGLE_SERVICE_ACCOUNT_JSON
VITE_GOOGLE_CLIENT_ID
VITE_GOOGLE_API_KEY
VITE_GOOGLE_APPS_SCRIPT_PUBLISH_URL
```

Required build env values, currently committed in the workflow because they are project IDs:

```txt
VITE_GOOGLE_SHEET_ID
VITE_GOOGLE_DRIVE_FOLDER_ID
VITE_ALLOWED_EDITORS
```

## Apps Script Publish Proxy

The publish button triggers `tools/google-apps-script/publish-proxy.gs`. Create an Apps Script Web App, paste that file, deploy as a Web App, and store its URL in GitHub Secret `VITE_GOOGLE_APPS_SCRIPT_PUBLISH_URL`.

Set these Apps Script properties:

```txt
ALLOWED_EDITORS=evyatarhazan3.14@gmail.com
GITHUB_TOKEN=<classic PAT or fine-grained token with Actions: write for this repo>
```

Optional overrides, already defaulted in the script:

```txt
GITHUB_OWNER=Evyatar-Hazan
GITHUB_REPO=nis-boutique-catering
GITHUB_WORKFLOW_FILE=cloudflare-pages.yml
```

The browser sends its short-lived Google OAuth access token to the Apps Script. The script verifies the user email with Google, checks `ALLOWED_EDITORS`, then calls GitHub `workflow_dispatch` on `main`.

Treat the Web App URL and GitHub token like secrets. If either leaks, rotate the GitHub token and redeploy the Web App.

## Local vs Production

Local development and production deployment do not use the exact same source of truth at every step.

### What local proves

Local work is the fastest way to prove that the codebase is internally healthy:

- `npx pnpm@9.15.9 --filter @monorepo/nis-content-studio build` proves the admin app still compiles.
- `npx pnpm@9.15.9 --filter @monorepo/nis-content-studio test` proves the current Studio test suite still passes.
- `npx pnpm@9.15.9 --filter @monorepo/nis-boutique-catering validate` proves the public site still passes its local quality gate.
- `npx pnpm@9.15.9 cloudflare:build:site` is the closest local approximation of the public-site production build.

Local success does **not** prove that the latest `main` commit is live.

### What production proves

Production truth for this repository comes from the deploy pipeline and the live domains:

1. GitHub Actions `nis Boutique Catering CI` must pass for the target commit.
2. GitHub Actions `Deploy to Cloudflare Pages` must pass for the same commit.
3. The live domains must respond successfully:
   - `https://nisboutiquecatering.com/`
   - `https://studio.nisboutiquecatering.com/`

Important: live `HTTP 200` alone is not enough proof that the latest HEAD deployed. A previously successful deploy can keep serving while the newest CI or Cloudflare run fails.

### Why local and production can diverge

The main divergence points in this repo are:

- Local public-site development can fall back to committed generated content.
- Production deploys set `CONTENT_SYNC_REQUIRE_REMOTE=true`, so remote content sync failures should fail the build instead of publishing stale content.
- GitHub Actions and Cloudflare Pages use their own runtime and env configuration, which can differ from the current local machine.
- The admin Studio can compile locally even when the public-site deploy path or Cloudflare deploy path is blocked.

### Recommended verification order

After any meaningful refactor, content-flow change, build change, or deploy-sensitive fix, use this order:

1. Run local validation.
2. Commit and push the change.
3. Wait for `nis Boutique Catering CI` to finish successfully.
4. Wait for `Deploy to Cloudflare Pages` to finish successfully.
5. Only then verify the live endpoints with `curl -I` or a browser check.

### Fast commands

```sh
npx pnpm@9.15.9 --filter @monorepo/nis-content-studio test
npx pnpm@9.15.9 --filter @monorepo/nis-content-studio build
npx pnpm@9.15.9 --filter @monorepo/nis-boutique-catering validate
gh run list --limit 6
curl -I https://nisboutiquecatering.com/
curl -I https://studio.nisboutiquecatering.com/
```

## Service Account Setup

Create a Google Cloud service account in the same project used by the OAuth client, then create a JSON key for it. Share the resources with the service account email:

- Google Sheet: Editor, required for the `content:seed` workflow and read by production builds.
- Drive media folder: Viewer, required for production builds to download source images.

```txt
Google Sheet: 101lO26iC3FzIJ7LdsGPCt1oJDR6RBHIkmeqcJ_Peyzk
Drive media folder: 1HSTXq2aJkRj4CrPcNeNDx4EpAHQsUWDv
```

Save the full downloaded JSON into GitHub Secret `GOOGLE_SERVICE_ACCOUNT_JSON`.
