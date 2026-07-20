import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const workspaceRoot = resolve(import.meta.dirname, '..');
const tokensPath = resolve(workspaceRoot, 'packages/site-preview/src/styles/tokens.css');
const basePath = resolve(workspaceRoot, 'packages/site-preview/src/styles/base.css');
const themePath = resolve(workspaceRoot, 'packages/site-preview/src/styles/theme.css');
const indexCssPath = resolve(workspaceRoot, 'apps/frontend/nis-boutique-catering/src/index.css');
const htmlPath = resolve(workspaceRoot, 'apps/frontend/nis-boutique-catering/index.html');
const tokens = readFileSync(tokensPath, 'utf8');
const publicStyles = [basePath, themePath, indexCssPath].map((path) => readFileSync(path, 'utf8')).join('\n');
const html = readFileSync(htmlPath, 'utf8');
const errors = [];

const requiredTokenGroups = {
  typography: ['font-display', 'font-body', 'type-base', 'type-display'],
  color: ['espresso', 'ivory', 'cream', 'rose', 'gold', 'sage', 'ink', 'muted', 'focus', 'danger', 'success', 'whatsapp'],
  spacing: ['space-1', 'space-4', 'space-8', 'content-max'],
  shape: ['radius-sm', 'radius-md', 'radius-lg', 'radius-pill'],
  depth: ['shadow-soft', 'shadow-deep', 'shadow-ring'],
  layers: ['z-content', 'z-sticky', 'z-progress', 'z-overlay'],
  motion: ['duration-fast', 'duration-base', 'duration-slow', 'ease', 'lift-ease'],
  breakpoints: ['breakpoint-mobile', 'breakpoint-desktop'],
  theme: [
    'theme-surface-page',
    'theme-surface-paper',
    'theme-surface-soft',
    'theme-surface-dark',
    'theme-text-primary',
    'theme-text-muted',
    'theme-text-on-dark',
    'theme-accent-brand',
    'theme-accent-premium',
    'theme-accent-secondary',
    'theme-border-subtle',
    'theme-focus',
    'theme-danger',
    'theme-success',
    'theme-whatsapp',
  ],
};

for (const [group, names] of Object.entries(requiredTokenGroups)) {
  const missing = names.filter((name) => !tokens.includes(`--${name}:`));
  if (missing.length > 0) errors.push(`${group} tokens missing: ${missing.join(', ')}`);
}

const requiredSemanticConsumers = [
  'theme-surface-page',
  'theme-surface-paper',
  'theme-surface-dark',
  'theme-text-primary',
  'theme-text-muted',
  'theme-accent-brand',
  'theme-accent-premium',
  'theme-accent-secondary',
  'theme-border-subtle',
  'theme-danger',
  'theme-success',
  'theme-whatsapp',
];
const unusedSemanticTokens = requiredSemanticConsumers.filter((name) => !publicStyles.includes(`var(--${name})`));
if (unusedSemanticTokens.length > 0) errors.push(`semantic theme tokens are not consumed: ${unusedSemanticTokens.join(', ')}`);

if (!basePath || !publicStyles.includes("@import './tokens.css';")) errors.push('base stylesheet does not import the canonical token source');
if (/Playfair Display/.test(publicStyles)) errors.push('legacy Playfair Display usage remains');
if (/@import\s+url\([^)]*fonts\.googleapis/.test(publicStyles)) errors.push('render-delaying Google Fonts CSS import remains');
if (!html.includes('family=Noto+Serif+Hebrew')) errors.push('Noto Serif Hebrew is not loaded');
if (!html.includes('display=swap')) errors.push('font loading does not use display=swap');
if (!html.includes('rel="preconnect" href="https://fonts.gstatic.com" crossorigin')) errors.push('font origin is not preconnected');

const authoredThemeStyles = [basePath, themePath, indexCssPath]
  .map((path) => ({ path, source: readFileSync(path, 'utf8') }));
const rawColorPattern = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\s*\((?!\s*var\()/g;

for (const { path, source } of authoredThemeStyles) {
  const rawColors = source.match(rawColorPattern) ?? [];
  if (rawColors.length > 0) {
    errors.push(`${path} contains ${rawColors.length} raw color values; move every palette value to tokens.css`);
  }
}

const parseHexToken = (name) => {
  const match = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Cannot read color token: ${name}`);
  return match[1];
};

const luminance = (hex) => {
  const channels = hex.slice(1).match(/.{2}/g).map((channel) => Number.parseInt(channel, 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

const contrast = (foreground, background) => {
  const foregroundLuminance = luminance(parseHexToken(foreground));
  const backgroundLuminance = luminance(parseHexToken(background));
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
};

const textPairs = [
  ['ink', 'paper'],
  ['ink', 'cream'],
  ['ivory', 'espresso'],
  ['muted', 'paper'],
  ['focus', 'paper'],
  ['ivory', 'rose'],
  ['ivory', 'sage'],
  ['ivory', 'whatsapp'],
];

for (const [foreground, background] of textPairs) {
  const ratio = contrast(foreground, background);
  if (ratio < 4.5) errors.push(`${foreground}/${background} contrast is ${ratio.toFixed(2)}:1`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`Design token error: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Design token check passed: ${Object.keys(requiredTokenGroups).length} token groups, ${textPairs.length} WCAG AA text pairs, zero raw colors in authored theme styles, Noto Serif Hebrew with display=swap.`);
}
