import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stylePaths = [
  'packages/site-preview/src/styles/base.css',
  'packages/site-preview/src/styles/theme.css',
];

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

  for (const match of source.matchAll(/transition\s*:\s*([^;]+);/gs)) {
    const declaration = match[1];
    if (layoutProperties.test(declaration)) {
      failures.push(`${relativePath}: transition animates a layout property: ${declaration.trim()}`);
    }
    if (!/var\(--duration-(?:fast|base|slow)\)/.test(declaration)) {
      failures.push(`${relativePath}: transition duration must use a motion token: ${declaration.trim()}`);
    }
  }
}

const baseStyles = styles.find(({ relativePath }) => relativePath.endsWith('base.css'))?.source ?? '';
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
if (!/\.reveal\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none;/s.test(reducedMotionBlock)) {
  failures.push('base.css: reduced-motion must reveal all deferred content immediately');
}
if (!/animation-duration:\s*0\.01ms\s*!important/.test(reducedMotionBlock)) {
  failures.push('base.css: reduced-motion must neutralize remaining entrance animations');
}

if (failures.length > 0) {
  console.error(`Motion system check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`Motion system check passed (${stylePaths.length} stylesheets, no continuous or layout motion).`);
