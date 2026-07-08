import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const outputRoot = resolve(repoRoot, 'output');
const command = process.argv[2] ?? 'list';

const formatBytes = (value) => {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 ** 2) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / 1024 ** 2).toFixed(2)} MB`;
};

const collectFiles = (directory) => {
  if (!existsSync(directory)) {
    return [];
  }

  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectFiles(absolutePath);
    }

    const stats = statSync(absolutePath);
    return [{
      absolutePath,
      relativePath: relative(repoRoot, absolutePath),
      size: stats.size,
    }];
  });
};

const ensureKnownCommand = () => {
  if (['list', 'clean'].includes(command)) {
    return;
  }

  console.error(`Unknown command "${command}". Use "list" or "clean".`);
  process.exit(1);
};

ensureKnownCommand();

if (command === 'clean') {
  if (!existsSync(outputRoot)) {
    console.log('output/ does not exist. Nothing to clean.');
    process.exit(0);
  }

  rmSync(outputRoot, { recursive: true, force: true });
  console.log('Removed local artifacts under output/.');
  process.exit(0);
}

const files = collectFiles(outputRoot);

if (files.length === 0) {
  console.log('output/ is empty.');
  process.exit(0);
}

const totalSize = files.reduce((sum, file) => sum + file.size, 0);

console.log(`Local artifacts in output/: ${files.length} file(s), ${formatBytes(totalSize)} total`);
for (const file of files.sort((left, right) => left.relativePath.localeCompare(right.relativePath))) {
  console.log(`- ${file.relativePath} (${formatBytes(file.size)})`);
}
