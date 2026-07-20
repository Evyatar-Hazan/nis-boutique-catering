# Deterministic legacy migration output

This directory was generated from the immutable backup at
`backups/legacy-google/20260720T080523Z` with:

```sh
pnpm --filter @monorepo/nis-boutique-catering migration:transform -- \
  backups/legacy-google/20260720T080523Z \
  migration/legacy-google/20260720T080523Z
```

The transformer fails on unknown section groups, missing Drive sources, or
unexpected required collection counts. Re-running it with the same backup must
produce byte-identical JSON files.

| File | SHA-256 |
| --- | --- |
| `archive.json` | `c4904a9c08917eec8b618aeb10fc6742a55d0910ee59247a8473b7ab4da62cc3` |
| `r2-manifest.json` | `be34d73a65ee065f3db1459bfef5b365161b6d2f329995ca52d1bef9b670bdbc` |
| `revision.json` | `e9d4e13816d75023123b48c223e0d78c7dd684a52d03b19852fa017dbdef54b7` |

The three JSON files are inputs for the Preview import. Do not edit them by
hand; regenerate them from the immutable backup and review the diff instead.
