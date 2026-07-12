import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');

const headerFiles = [
  {
    label: 'public site',
    path: 'apps/frontend/nis-boutique-catering/public/_headers',
    requiredHeaders: [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ],
    requiredCspDirectives: [
      "default-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "script-src 'self'",
      "style-src 'self'",
      "connect-src 'self'",
      'https://static.cloudflareinsights.com',
      'https://cloudflareinsights.com',
      "form-action 'self'",
    ],
  },
  {
    label: 'admin studio',
    path: 'apps/admin/nis-content-studio/public/_headers',
    requiredHeaders: [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Robots-Tag',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ],
    requiredCspDirectives: [
      "default-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "script-src 'self'",
      'https://accounts.google.com',
      'https://apis.google.com',
      'https://www.googleapis.com',
      'https://sheets.googleapis.com',
      'https://script.google.com',
      'https://nisboutiquecatering.com',
      'https://static.cloudflareinsights.com',
      'https://cloudflareinsights.com',
      'img-src \'self\' data: blob: https://www.googleapis.com https://drive.google.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://ssl.gstatic.com https://www.gstatic.com https://nisboutiquecatering.com',
      "form-action 'self'",
    ],
  },
];

const parseHeaders = (content) => {
  const headers = new Map();

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '/*' || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const name = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1).trim();
    headers.set(name.toLowerCase(), { name, value });
  }

  return headers;
};

const errors = [];

for (const headerFile of headerFiles) {
  const absolutePath = resolve(repoRoot, headerFile.path);
  const headers = parseHeaders(readFileSync(absolutePath, 'utf8'));

  for (const requiredHeader of headerFile.requiredHeaders) {
    if (!headers.has(requiredHeader.toLowerCase())) {
      errors.push(`${headerFile.label}: missing ${requiredHeader} in ${headerFile.path}`);
    }
  }

  const csp = headers.get('content-security-policy')?.value ?? '';
  for (const directive of headerFile.requiredCspDirectives) {
    if (!csp.includes(directive)) {
      errors.push(`${headerFile.label}: Content-Security-Policy missing directive/source "${directive}"`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Response header check passed.');
