import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');

const workspaces = [
  {
    name: '@monorepo/content-schema',
    root: resolve(repoRoot, 'packages/content-schema'),
    allowedWorkspaceImports: new Set(),
  },
  {
    name: '@monorepo/site-preview',
    root: resolve(repoRoot, 'packages/site-preview'),
    allowedWorkspaceImports: new Set(['@monorepo/content-schema']),
  },
  {
    name: '@monorepo/nis-boutique-catering',
    root: resolve(repoRoot, 'apps/frontend/nis-boutique-catering'),
    allowedWorkspaceImports: new Set(['@monorepo/content-schema', '@monorepo/site-preview']),
  },
  {
    name: '@monorepo/nis-content-studio',
    root: resolve(repoRoot, 'apps/admin/nis-content-studio'),
    allowedWorkspaceImports: new Set(['@monorepo/content-schema', '@monorepo/site-preview']),
  },
];

const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx']);
const importPattern = /(?:from\s+|import\s*(?:\(\s*)?)(['"])([^'"]+)\1/g;
const errors = [];

const walk = (directory) => readdirSync(directory)
  .flatMap((entry) => {
    const absolutePath = resolve(directory, entry);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      return walk(absolutePath);
    }
    const extension = entry.slice(entry.lastIndexOf('.'));
    return sourceExtensions.has(extension) ? [absolutePath] : [];
  });

const isInside = (candidate, parent) => candidate === parent || candidate.startsWith(`${parent}${sep}`);

for (const workspace of workspaces) {
  const sourceRoot = resolve(workspace.root, 'src');
  for (const file of walk(sourceRoot)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[2];
      if (specifier.startsWith('@monorepo/')) {
        const importedWorkspace = workspaces.find(({ name }) => specifier === name || specifier.startsWith(`${name}/`));
        if (!importedWorkspace) {
          errors.push(`${relative(repoRoot, file)} imports unknown workspace package ${specifier}`);
          continue;
        }
        if (!workspace.allowedWorkspaceImports.has(importedWorkspace.name)) {
          errors.push(`${relative(repoRoot, file)} may not import ${importedWorkspace.name}`);
        }
        if (specifier.includes('/src/') || specifier.endsWith('/src')) {
          errors.push(`${relative(repoRoot, file)} deep-imports private source via ${specifier}`);
        }
      }

      if (specifier.startsWith('.')) {
        const resolvedImport = resolve(dirname(file), specifier);
        if (!isInside(resolvedImport, workspace.root)) {
          errors.push(`${relative(repoRoot, file)} escapes its workspace with ${specifier}`);
        }
      }
    }
  }
}

const dependencyGraph = new Map(workspaces.map((workspace) => [
  workspace.name,
  [...workspace.allowedWorkspaceImports],
]));

const visit = (name, path = []) => {
  if (path.includes(name)) {
    errors.push(`Workspace dependency cycle: ${[...path, name].join(' -> ')}`);
    return;
  }
  for (const dependency of dependencyGraph.get(name) ?? []) {
    visit(dependency, [...path, name]);
  }
};

for (const workspace of workspaces) {
  visit(workspace.name);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Architecture boundary check passed.');
