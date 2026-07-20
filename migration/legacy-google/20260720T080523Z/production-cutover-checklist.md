# Production content cutover checklist

Status: `PASSED`

Scope: `MIG-004` — legacy Google content import into Cloudflare D1/R2 Production.

## Approval and freeze

- Execution approval: the project owner instructed Codex to execute every tracker task through local validation, push, deployment and Production verification, then explicitly instructed it to continue.
- Legacy write freeze began at `2026-07-20T13:13:44Z`, when the final read-only backup workflow started. The rebuilt studio had already removed Google write scopes and no longer provided a Sheets/Drive write path.
- Final delta backup: workflow `29745345594`, artifact `8462164511`, timestamp `20260720T131439Z`, 5 Sheets / 163 rows / 18 Drive files.
- Delta result: the final snapshot equals the immutable `20260720T080523Z` migration source after excluding the expected `updatedAt` timestamp; collection counts are identical (`16` media, `15` gallery, `3` services, `116` legacy sections). No delta was missing.

## Before mutation

- Public root, studio root and `/api/health`: HTTP `200`.
- Production D1: 1 active admin; 0 revisions, 0 media, 0 publish jobs, 0 sessions and 0 foreign-key violations.
- D1 Time Travel rollback bookmark: `00000025-00000000-000050ae-fac51a19b128051481b1cb1ec7448740`.
- Public build source remained legacy Google during this task; therefore a failed import could not change the live public site.

## Import and parity

- Production writer required `NIS_PRODUCTION_CUTOVER_CONFIRM=IMPORT_LEGACY_TO_PRODUCTION` and reused the Preview-tested import engine.
- Imported 16 unique media rows and 16 R2 objects. Every source was checked before upload, downloaded again after upload, and verified byte-for-byte by SHA-256 and size.
- Created draft `b5bd90fb-ded3-583c-ab50-8bfa17f2bd26` and published revision `b6398b25-f48f-5eeb-a6a8-bbd4d83add2f`.
- Content checksum: `ded45021c11d53b33e4c6866b89a4e30e2c58a1b94ff0a1bf99fa73b375b42ce`.
- Post-import parity: 1 draft, 1 published revision, 16 media rows, 16 unique object keys, 16 unique checksums, 0 jobs and 0 foreign-key violations.
- Public content endpoint returned revision `b6398b25`, schema v2 and the expected 16-media registry with a revision ETag. A referenced R2 image returned HTTP `200`, 453,816 bytes and the expected immutable checksum ETag.

## Authenticated owner smoke

- A short-lived, hashed Production session was inserted for the existing active owner solely for the smoke test; no Google token or reusable credential was stored in the repository or this report.
- Chrome loaded the six-section editor, all 16 media choices, live preview, publish history and admin management from the Production API/R2 surface.
- A reversible Hero eyebrow edit saved draft version `1→2`; restoring the original value saved version `2→3`. The final draft and published content are identical except for the expected draft `updatedAt` audit timestamp.
- The temporary session row and browser cookie were deleted. Final state: 0 sessions, 0 jobs and 0 foreign-key violations; anonymous session access returned `401`.

## Rollback readiness

- D1 rollback: restore bookmark `00000025-00000000-000050ae-fac51a19b128051481b1cb1ec7448740`, re-run migrations as no-op and verify counts/FK.
- R2 rollback: delete only the 16 object keys enumerated and checksummed in `r2-manifest.json`; no unrelated key was touched by the importer.
- Runtime rollback: public build still uses Google until `MIG-005`; the latest pre-import studio deployment remains available in Cloudflare Pages. A rollback therefore restores D1, removes only manifested R2 objects and promotes the retained prior Pages deployment if required.
- Sheets/Drive remain intact and read-only for the stability window.

Signed execution record: Codex, acting under the project owner's explicit end-to-end task authorization, `2026-07-20T14:55:06Z`.
