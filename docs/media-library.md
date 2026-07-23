# NIS Drive Media Library

The private media library is a separate application at
`apps/admin/nis-media-library`, deployed to
`https://media.nisboutiquecatering.com`.

Its purpose is to give the catering team a simple mobile-first interface for
maintaining a searchable source-photo archive in Google Drive. It is not the
public website's publishing system: the Content Studio remains the authority for
published content and its D1/R2 media.

## User flow

1. An authorized user signs in with Google.
2. The user selects one or more JPG, PNG, WebP, or AVIF files.
3. Each file receives its own human-readable description.
4. The description becomes the searchable Drive filename.
5. The file is stored under `NIS Catering Media/<year>/<month>/`.
6. Users can search, preview, rename, move a file to Drive trash, or restore it.

Uploads are limited to 15 MB per image. Removing a photo is recoverable because
the app uses Google Drive trash rather than permanent deletion.

## Access model

- Google Identity verifies the sign-in ID token.
- D1 holds the explicit email allowlist and revocable hashed sessions.
- The bootstrap administrator can add or disable authorized email addresses from
  the app.
- The app refuses same-origin mutations from foreign origins.
- Drive refresh tokens are encrypted with AES-GCM before they are stored in D1.
- `GOOGLE_CLIENT_SECRET` and `DRIVE_TOKEN_ENCRYPTION_KEY` are Cloudflare encrypted
  secrets and must never be committed.
- The app requests `drive.file`, so it can operate only on files and folders
  created or explicitly used by this app.
- Each managed image has a private app marker; the image proxy and mutation routes
  reject unmarked files.

The Drive connection is account-wide for this application. The first administrator
must connect the Google account that should own the catering archive. Do not connect
a personal Drive as a temporary substitute.

## Cloudflare resources

| Environment | Pages project | D1 database |
| --- | --- | --- |
| Preview/local target | `nis-media-library` | `nis-media-library-preview` |
| Production | `nis-media-library` | `nis-media-library-production` |

Production uses the custom domain `media.nisboutiquecatering.com`. Pages Functions
serve `/api/*`; all other routes are static Vite assets. `robots.txt` blocks
crawling.

## Google OAuth configuration

The existing Google Cloud project and web OAuth client contain:

- JavaScript origins:
  - `https://nis-media-library.pages.dev`
  - `https://media.nisboutiquecatering.com`
- Redirect URIs:
  - `https://nis-media-library.pages.dev/api/drive/callback`
  - `https://media.nisboutiquecatering.com/api/drive/callback`
- Enabled API: Google Drive API
- Declared scope: `https://www.googleapis.com/auth/drive.file`

## Local development

Create local, ignored values from the example files:

```bash
cp apps/admin/nis-media-library/.env.example \
  apps/admin/nis-media-library/.env.local
cp apps/admin/nis-media-library/.dev.vars.example \
  apps/admin/nis-media-library/.dev.vars
```

Then run:

```bash
pnpm media-library:db:migrate:local
pnpm media-library:pages:dev
```

The seed command targets the remote preview database by default and requires an
explicit bootstrap email and display name:

```bash
BOOTSTRAP_ADMIN_EMAIL=owner@example.com \
BOOTSTRAP_ADMIN_NAME="Archive Owner" \
pnpm media-library:db:seed
```

For production, also set `MEDIA_LIBRARY_ENV=production` and
`CONFIRM_PRODUCTION=yes`.

## Deployment

Every push to `main` runs the repository validation gate, builds all three
applications, and deploys all three Cloudflare Pages projects. The media library
build receives `VITE_GOOGLE_CLIENT_ID` from GitHub Actions. Runtime secrets and D1
bindings remain configured in Cloudflare.

Database schema changes are not applied implicitly by the Pages deployment. Review
and apply migrations deliberately:

```bash
pnpm media-library:db:migrate:preview
pnpm media-library:db:migrate:production
```

## First production handoff

1. Sign in at `https://media.nisboutiquecatering.com` with the bootstrap admin.
2. Open settings and choose **Connect Google Drive**.
3. Authenticate as the Google account that should own the catering archive.
4. Add the catering owner's email to the allowlist.
5. Sign out and verify that the newly authorized user can sign in, upload a test
   image, rename it, move it to trash, and restore it.

The final Drive authorization is deliberately an owner action because it grants
ongoing access to that account's app-created files.
