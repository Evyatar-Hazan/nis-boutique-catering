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

## Service Account Setup

Create a Google Cloud service account in the same project used by the OAuth client, then create a JSON key for it. Share the resources with the service account email:

- Google Sheet: Editor, required for the `content:seed` workflow and read by production builds.
- Drive media folder: Viewer, required for production builds to download source images.

```txt
Google Sheet: 101lO26iC3FzIJ7LdsGPCt1oJDR6RBHIkmeqcJ_Peyzk
Drive media folder: 1HSTXq2aJkRj4CrPcNeNDx4EpAHQsUWDv
```

Save the full downloaded JSON into GitHub Secret `GOOGLE_SERVICE_ACCOUNT_JSON`.
