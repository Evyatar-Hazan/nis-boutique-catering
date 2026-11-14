import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(appRoot, 'data', 'products.csv');
const outputPath = path.join(appRoot, 'data', 'products.js');
const forbiddenSeqs = new Set([59]);
const expectedApprovedCount = 43;

const parseCsv = (source) => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (!quoted && character === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += character;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [rawHeaders, ...dataRows] = rows;
  if (!rawHeaders) throw new Error('products.csv is empty.');
  const headers = rawHeaders.map((header) => header.replace(/^\uFEFF/u, '').trim());
  return dataRows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])),
  );
};

const source = await readFile(sourcePath, 'utf8');
const sourceRows = parseCsv(source);
const publishedProducts = sourceRows
  .filter((row) => row.status.trim() === 'approved')
  .filter((row) => !forbiddenSeqs.has(Number(row.seq)))
  .map((row) => ({
    seq: Number(row.seq),
    category: row.category.trim(),
    name: row.name.trim(),
    description: row.description.trim(),
    priceIls: row.price_ils.trim() ? Number(row.price_ils) : null,
    priceLabel: row.price_label.trim() || null,
    priceUnit: row.price_unit.trim() === 'per_unit' ? 'per_unit' : null,
    status: 'approved',
    images: row.images.split('|').map((image) => image.trim()).filter(Boolean),
  }));

if (publishedProducts.some((product) => forbiddenSeqs.has(product.seq))) {
  throw new Error('A forbidden product passed the publication gate.');
}
if (publishedProducts.length !== expectedApprovedCount) {
  throw new Error(
    `Expected ${expectedApprovedCount} approved products, received ${publishedProducts.length}.`,
  );
}
if (publishedProducts.some((product) =>
  (product.priceIls !== null && !Number.isFinite(product.priceIls))
  || (product.priceIls === null && !product.priceLabel)
  || product.images.length === 0
)) {
  throw new Error('Every published product must have a numeric price or price label and at least one image.');
}

const generated = `// Generated from data/products.csv. Do not edit manually.\n` +
  `export const products = ${JSON.stringify(publishedProducts, null, 2)};\n`;

await writeFile(outputPath, generated, 'utf8');
console.log(`Generated ${publishedProducts.length} approved products in data/products.js.`);
