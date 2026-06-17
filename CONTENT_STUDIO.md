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
```

`GOOGLE_SERVICE_ACCOUNT_JSON` should be the full service-account JSON string. Share the Google Sheet and Drive media folder with the service account email.

Build command for the public site should run:

```sh
npx pnpm@9.15.9 cloudflare:build:site
```

If Google env is missing, `content:sync` falls back to the committed fallback content so builds stay stable.

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
```

Required GitHub variables or secrets:

```txt
GOOGLE_SERVICE_ACCOUNT_JSON
```

Admin build-time values are currently non-secret browser config, but keep them in GitHub secrets/variables if possible:

```txt
VITE_GOOGLE_CLIENT_ID
VITE_GOOGLE_API_KEY
VITE_GOOGLE_SHEET_ID
VITE_GOOGLE_DRIVE_FOLDER_ID
VITE_ALLOWED_EDITORS
```

## Apps Script Publish Proxy

The publish button can later trigger a GitHub `workflow_dispatch` or Cloudflare deploy hook. If using a deploy hook, store it server-side in Apps Script, not in the browser.

```js
const ALLOWED_EDITORS = ['owner@example.com'];
const CLOUDFLARE_DEPLOY_HOOK_URL = 'https://api.cloudflare.com/client/v4/...';

function doPost(e) {
  const email = Session.getActiveUser().getEmail().toLowerCase();

  if (!ALLOWED_EDITORS.includes(email)) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'forbidden' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const response = UrlFetchApp.fetch(CLOUDFLARE_DEPLOY_HOOK_URL, { method: 'post', muteHttpExceptions: true });

  return ContentService.createTextOutput(JSON.stringify({
    ok: response.getResponseCode() >= 200 && response.getResponseCode() < 300,
    status: response.getResponseCode(),
  })).setMimeType(ContentService.MimeType.JSON);
}
```

Treat the Web App URL like a secret. If it leaks, redeploy the script and rotate the deploy hook.
