# Preview Parity Skill

This project has a strict rule for Studio previews:

- A Studio preview must render the real site component.
- A Studio preview must use the real site CSS.
- A Studio preview must run inside its own real viewport.
- A Studio preview must load the same real assets the site uses.
- A Studio preview must preserve real interaction behavior inside the preview.
- A Studio preview is not complete until it is visually checked against the live/local site.

If any of those are missing, the preview is considered approximate and not production-ready.

## Goal

Make every editable Studio screen show a preview that behaves like the real site in desktop and mobile, without repeated back-and-forth fixes.

## Required Architecture

Use this architecture for any Studio preview that represents a real public-site section:

1. Extract or reuse the real site section component from `apps/frontend/nis-boutique-catering`.
2. Pass managed content into that real component through props.
3. Render the preview inside an `iframe`, not a regular `div`, when layout depends on viewport breakpoints.
4. Inject the real site CSS into the `iframe`.
5. Give the `iframe` an explicit desktop viewport and an explicit mobile viewport.
6. Scale the desktop frame visually only at the outer Studio wrapper level. Do not let the component compute layout from the Studio page width.
7. Set the `iframe` document base so relative assets resolve exactly like the real site.
8. Keep the preview interactive. Prevent unwanted navigation with targeted click interception, not by disabling pointer events.
9. Use dynamic preview height when the section can grow vertically. Do not assume a fixed frame height is enough for long mobile sections.

## What Not To Do

Do not do any of the following:

- Do not rebuild the section markup separately inside Studio.
- Do not create "preview-only" typography, spacing, or grid behavior for a real site section.
- Do not rely on `ShadowRoot` alone for responsive parity when the section depends on viewport media queries.
- Do not treat "same content" as "same preview".
- Do not disable interactions with `pointer-events: none` when the user needs to verify buttons, tabs, or toggles.
- Do not block images, videos, or other media by letting relative URLs resolve against the Studio origin.
- Do not hide overflow or crop a section just to make it fit inside a preview card.
- Do not mark a preview fix as done after `build` only.

## Default Implementation Pattern

### 1. Reuse the real component

If a site section is defined inside a large file, first move it into a dedicated component file.

Example path:

- `apps/frontend/nis-boutique-catering/src/components/sections/<SectionName>.tsx`

The public site should import and use that component too, so Studio and site share the same rendering code.

### 2. Add a Studio iframe preview wrapper

For responsive sections, use a wrapper shaped like this:

- Studio component owns the preview frame
- `iframe` owns the real viewport
- React portal mounts the real section into the `iframe` root
- Real site CSS is injected into the `iframe` document

The Studio side may scale the desktop iframe down for visibility, but the inner viewport dimensions must stay real.

### 3. Use fixed preview viewports

Use explicit dimensions per mode unless there is a strong reason to change them:

- Desktop preview viewport: `1440 x 810`
- Mobile preview viewport: `390 x 844`

If a section requires another canonical viewport, document it in the PR/change.

### 4. Inject the real site CSS

Inject both:

- `apps/frontend/nis-boutique-catering/src/styles/base.css`
- `apps/frontend/nis-boutique-catering/src/styles/theme.css`

If the site later splits styles further, the preview must import the full set required by that section.

### 5. Resolve assets like the real site

The preview must resolve images, videos, and other relative assets exactly like the public site.

Default rule:

- add a `<base>` tag to the `iframe` document
- point it at the real site origin for production checks
- point it at the local frontend origin for local development checks

If assets are loaded from generated media paths or CMS-style relative URLs, verify those URLs inside the `iframe` document, not just in the parent Studio page.

### 6. Preserve real interactions

Preview parity includes interaction parity.

Required behavior:

- buttons must be clickable
- chips, tabs, filters, and toggles must respond
- hover and focus states must still work when relevant

If the preview must not navigate away from Studio:

- intercept link clicks inside the `iframe`
- allow non-navigation interactions to keep working
- avoid blanket interaction shutdown

### 7. Match full section height

When a section is taller than the initial viewport, the preview must still show the full experience correctly.

Use this rule:

- keep canonical viewport width for device mode
- let preview height expand to the rendered content when validation requires full-section inspection
- especially for mobile, verify that the user can reach the entire section without clipped content

Fixed-height frames are acceptable only when the real user experience is also intentionally clipped to that viewport.

## Verification Workflow

Every preview-parity change must be validated in this order:

1. Run code checks on Studio:
   - `./node_modules/.bin/eslint src/App.tsx`
   - `./node_modules/.bin/tsc -b`
   - `./node_modules/.bin/vite build`
2. Run affected frontend checks when shared components are touched:
   - `./node_modules/.bin/eslint ...`
   - `./node_modules/.bin/vitest run`
   - `./node_modules/.bin/vite build`
3. Run the Studio locally.
4. Open the real site locally or live.
5. Compare Studio preview vs site in:
   - desktop
   - mobile
6. Confirm:
   - same line breaks
   - same block order
   - same responsive switch point behavior
   - same visible cropping / no hidden overflow surprises
   - same first-view composition intent
   - same media loading
   - same interactive controls behavior
   - same full-content reachability in long sections

## Visual Check Requirement

For responsive preview work, "looks correct in code" is not enough.

At minimum:

1. Capture the Studio preview.
2. Capture the real site section in the same target mode.
3. Compare them side by side before declaring success.

Use Playwright with local Chrome when available. If automated browser capture is blocked, state that clearly and do a manual browser verification before pushing.

For this project, visual parity is not enough on its own. Also verify:

1. images and other assets actually load
2. interactive elements are actually clickable
3. mobile preview does not truncate long content

## When To Use iframe Instead Of Shadow DOM

Use `iframe` when:

- the public section depends on media queries
- the public section changes behavior between desktop and mobile
- the preview must match the real site viewport exactly

`ShadowRoot` can still be acceptable for isolated non-responsive fragments, but not as the default for public responsive section parity.

## Migration Rule For Existing Studio Previews

When touching an existing preview:

1. Check whether it is a hand-built Studio copy.
2. If yes, do not keep extending that copy.
3. Move it toward:
   - shared site component
   - real site CSS
   - iframe viewport
4. Only keep a custom preview if the section is intentionally not meant to match the site exactly.

## Definition Of Done

A Studio preview task is done only if all of these are true:

1. It renders the real public component.
2. It uses the real public styles.
3. It runs inside a real preview viewport.
4. Desktop and mobile both behave like the site.
5. Assets load like the site.
6. Interactive controls work inside the preview.
7. Long mobile content is fully reachable.
8. Code checks pass.
9. Visual comparison was actually performed.
10. The change is pushed to `main`.

## First Reuse Target

This skill was established after fixing the `intro-band` / `רעיון אחד ברור` preview.

Use that implementation as the reference example for future Studio preview parity work.
