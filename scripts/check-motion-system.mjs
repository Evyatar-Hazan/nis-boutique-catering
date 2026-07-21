import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stylePaths = [
  'packages/site-preview/src/styles/base.css',
  'packages/site-preview/src/styles/theme.css',
];
const scrollHookPath = 'apps/frontend/nis-boutique-catering/src/hooks/useScrollAnimation.ts';

const styles = await Promise.all(
  stylePaths.map(async (relativePath) => ({
    relativePath,
    source: await readFile(path.join(repositoryRoot, relativePath), 'utf8'),
  })),
);

const failures = [];
const layoutProperties = /\b(?:padding|margin|gap|width|height|inset(?:-[a-z-]+)?|top|right|bottom|left)\b/;

for (const { relativePath, source } of styles) {
  if (/\binfinite\b/.test(source)) {
    failures.push(`${relativePath}: continuous animation is not allowed`);
  }

  if (/transition\s*:\s*all\b/.test(source)) {
    failures.push(`${relativePath}: transition: all is not allowed`);
  }

  for (const match of source.matchAll(/transition\s*:\s*([^;]+);/gs)) {
    const declaration = match[1];
    if (layoutProperties.test(declaration)) {
      failures.push(`${relativePath}: transition animates a layout property: ${declaration.trim()}`);
    }
    if (declaration.trim() !== 'none' && !/var\(--(?:duration-(?:fast|base|slow)|reveal-duration)\)/.test(declaration)) {
      failures.push(`${relativePath}: transition duration must use a motion token: ${declaration.trim()}`);
    }
  }
}

const baseStyles = styles.find(({ relativePath }) => relativePath.endsWith('base.css'))?.source ?? '';
const motionStylesBeforeReducedPreference = baseStyles.split('@media (prefers-reduced-motion: reduce)')[0] ?? baseStyles;
const scrollHook = await readFile(path.join(repositoryRoot, scrollHookPath), 'utf8');
const requiredStateSelectors = [
  ".button:active",
  ".button:disabled",
  ".button[aria-disabled='true']",
  ".button[aria-busy='true']",
  ".button[data-state='success']",
  ".button[data-state='error']",
  'button:focus-visible',
  '.form-field__error',
];

for (const selector of requiredStateSelectors) {
  if (!baseStyles.includes(selector)) {
    failures.push(`base.css: missing interaction state selector ${selector}`);
  }
}

const reducedMotionBlock = baseStyles.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}\s*$/)?.[1] ?? '';
if (!/\.scroll-motion-ready \.reveal\s*\{[^}]*transition:\s*[^}]*opacity[^}]*transform/s.test(baseStyles)) {
  failures.push('base.css: reveal transition must remain active in both hidden and visible states');
}
if (/\.scroll-motion-ready \.reveal:not\(\.is-visible\)\s*\{[^}]*transition:/s.test(motionStylesBeforeReducedPreference)) {
  failures.push('base.css: reveal transition cannot exist only on the hidden state');
}
if (!/\.scroll-motion-ready \.reveal:not\(\.is-visible\)\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none;[^}]*transition:\s*none;/s.test(reducedMotionBlock)) {
  failures.push('base.css: reduced-motion must reveal all deferred content immediately');
}
if (!/animation-duration:\s*0\.01ms\s*!important/.test(reducedMotionBlock)) {
  failures.push('base.css: reduced-motion must neutralize remaining entrance animations');
}
if (!/@supports \(animation-timeline: view\(\)\)/.test(baseStyles) || !/view-timeline-name:\s*--[a-z-]+/.test(baseStyles) || !/animation-range:/.test(baseStyles)) {
  failures.push('base.css: scroll-driven media motion must be feature-detected with a view timeline');
}
for (const selector of ['.scroll-scene__hero-copy', '.gallery-item > .optimized-picture', '.process-list::after', '.trust-media > img']) {
  if (!reducedMotionBlock.includes(selector)) {
    failures.push(`base.css: reduced-motion must neutralize scroll scene ${selector}`);
  }
}
if (!/animation:\s*none(?:\s*!important)?;[\s\S]*transform:\s*none(?:\s*!important)?;/s.test(reducedMotionBlock)) {
  failures.push('base.css: reduced-motion must neutralize scroll-driven transforms');
}
if (/addEventListener\(\s*['"]scroll['"]/.test(scrollHook)) {
  failures.push(`${scrollHookPath}: scroll-triggered reveals must not add a scroll listener`);
}
if (/scrollTo\(|scrollBy\(|scrollIntoView\(|document\.body\.style\.overflow/.test(scrollHook)) {
  failures.push(`${scrollHookPath}: scroll hijacking or scroll locking is not allowed`);
}

if (failures.length > 0) {
  console.error(`Motion system check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`Motion system check passed (${stylePaths.length} stylesheets, no continuous or layout motion).`);
