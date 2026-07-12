# Repository History

This document is the human-readable historical log for major architecture, workflow, and operational changes in `nis-boutique-catering`.

It is not a full changelog of every commit.

It exists to answer four practical questions quickly:

1. How did the repo reach its current structure?
2. Which architectural changes already happened?
3. Which operational policies are now considered settled?
4. Which dates matter when debugging regressions or explaining why a rule exists?

## Current State Snapshot

As of July 12, 2026:

- the repo is a Turborepo with a public site, a private content studio, and shared packages
- production deploys run through GitHub Actions into Cloudflare Pages
- managed content source of truth is Google Sheets + Google Drive
- production builds require remote content sync instead of silently publishing fallback content
- `robots.txt` ownership is enforced at the repo/workflow level instead of Cloudflare managed injection
- both apps ship with repo-owned hardened response headers, including `Content-Security-Policy`, `Strict-Transport-Security`, and frame protections

## Timeline

### June 20-21, 2026: Real Preview Foundation

The studio preview system moved away from lightweight mock rendering toward real iframe-based previews:

- intro preview started rendering inside a real iframe viewport
- preview parity rules were formalized
- sitemap and preview behavior were upgraded to better reflect the public site

Why it mattered:

- reduced the gap between “looks right in Studio” and “looks right on the real site”
- established preview parity as an architectural requirement, not a visual nice-to-have

### June 21-22, 2026: Duplicate Content Cleanup

The project removed and merged several duplicate content sections:

- duplicate boutique / booking basics content was removed
- duplicate services / SEO content was removed
- remaining duplicate content sections were merged

Why it mattered:

- reduced editor confusion
- simplified the content model before larger refactors
- made later extraction work safer because fewer overlapping sections remained

### June 23-30, 2026: Studio Modularization And Shared Package Extraction

This was the main refactor phase for studio maintainability.

Key changes:

- editor components were extracted into smaller units
- hero editor, section editors, site map editors, media library pieces, and overview preview pieces were separated
- shared action helpers and render helpers were deduplicated
- a shared `site-preview` package was introduced
- preview data, preview sections, preview styles, and selectors were progressively moved into shared code
- cross-layer imports were reduced and defaults were localized where sharing had gone too far

Why it mattered:

- the studio stopped behaving like one large monolithic React surface
- duplication was reduced substantially
- file ownership became clearer
- preview logic became reusable without forcing every studio concern into one package

### June 30, 2026: Workspace And Workflow Clarification

The repo added several structural and operational clarifications:

- studio auth session, publish flow, media library, workspace chrome, site map workspace, and services workspace were extracted
- local-vs-production verification was documented
- local-only `output/` artifacts were explicitly separated from production source-of-truth files
- studio robots policy was hardened

Why it mattered:

- the team gained a clearer boundary between source files, generated files, and disposable local outputs
- deploy verification became a documented process instead of tribal knowledge

### July 5-6, 2026: Runtime, CI, And Performance Alignment

The repo then focused on build and runtime consistency.

Key changes:

- local and CI quality gates were aligned
- engine warning noise was reduced
- `validate` was strengthened to include build work
- runtime policy was aligned to Node 24
- local CI parity workflow was added
- below-the-fold site sections and studio preview loading were deferred for performance
- the studio preview data contract was centralized
- content flow documentation was expanded into a full end-to-end source-of-truth document

Why it mattered:

- fewer “works locally, fails in CI” cases
- faster diagnosis when runtime or dependency drift appears
- better shared understanding of the deploy-sensitive content pipeline

### July 8-12, 2026: Operational Hardening

July 8 focused on production ownership and deploy safety.

Key changes:

- `output/` policy was formalized in documentation
- Cloudflare-managed `robots.txt` was replaced with repo-owned `robots.txt`
- the deploy workflow was updated to disable managed robots when permissions allow it
- deploy behavior was softened so token-permission issues surface as explicit warnings instead of opaque failures
- remote content sync was hardened with retries, better error messages, and range compatibility fallback
- public site and studio response headers were hardened with `Strict-Transport-Security`, `Content-Security-Policy`, and related protections
- an unsafe CSP attempt was rolled back, then replaced with app-specific policies that allow the public site's Google Fonts, Cloudflare Web Analytics, and the studio's Google Identity, Sheets, Drive, Picker, Apps Script, and live-site verification flows
- `validate` now checks the repo-owned response headers so CSP cannot disappear silently again

Why it mattered:

- production behavior became more deterministic
- failures moved from “mysterious pipeline break” to “actionable operational signal”
- search/crawl and security-related headers are now owned and versioned in the repo

## Architectural Decisions That Are Now Settled

The following decisions should be treated as current project policy unless superseded by a newer doc:

- Google Sheets + Google Drive are the managed content source of truth
- generated static snapshot files are derived artifacts, not the primary editing surface
- Cloudflare Pages is the production hosting target for both apps
- `output/` is local-only and never a deploy input
- Studio preview parity should use real site rendering patterns whenever possible
- duplicated UI logic should be extracted into dedicated files before adding more behavior
- deploy-sensitive changes must be verified in this order:
  1. local validation
  2. push
  3. CI success
  4. deploy success
  5. live production verification

## How To Maintain This File

Update this document when one of the following happens:

- a structural refactor changes how the repo is organized
- a deploy or runtime policy changes
- the production ownership model changes
- a content or preview architecture decision becomes stable
- a historical explanation is needed to justify a current rule

Do not update it for:

- routine content edits
- small styling fixes
- test-only tweaks with no architectural effect
- every individual commit
