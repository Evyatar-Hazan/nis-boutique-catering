# Legacy Google migration backups

Each timestamped directory is an immutable, credential-free export created before the D1/R2 migration. Never edit an existing timestamp; create a new backup run instead.

Verify hashes, schema, counts and a sandbox restore:

```sh
node scripts/verify-legacy-google-backup.mjs backups/legacy-google/<TIMESTAMP>
```

Restore to a sandbox by copying the timestamped directory, verifying `backup-manifest.json`, then using `generated-snapshot.json`, `sheets-export.json` and the ID-addressed `drive-files/` as inputs. Production restoration is intentionally not automatic: first compare every manifest SHA-256 and count, restore to Preview, run content/media validation, and obtain explicit cutover approval.

GitHub Actions run artifacts are a secondary 90-day copy. The committed timestamped directory is the durable source of truth.
