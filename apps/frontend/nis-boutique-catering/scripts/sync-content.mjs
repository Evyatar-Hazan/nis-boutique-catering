import {
  fallbackPath,
  readJson,
  validateContentShape,
  writeGeneratedSnapshot,
} from './content-utils.mjs';

const snapshot = readJson(fallbackPath);
const errors = validateContentShape(snapshot);

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

writeGeneratedSnapshot(snapshot);
console.log('Generated local content from the committed fallback snapshot.');
