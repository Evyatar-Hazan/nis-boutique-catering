const expectedNodeMajor = 20;
const expectedNodeVersion = '20.19.0';
const expectedPnpmVersion = '9.15.9';

const nodeVersion = process.versions.node;
const nodeMajor = Number.parseInt(nodeVersion.split('.')[0] ?? '', 10);
const userAgent = process.env.npm_config_user_agent ?? '';
const pnpmMatch = /pnpm\/([0-9.]+)/.exec(userAgent);
const pnpmVersion = pnpmMatch?.[1] ?? 'unknown';

const errors = [];

if (nodeMajor !== expectedNodeMajor) {
  errors.push(`Expected Node ${expectedNodeVersion} (major ${expectedNodeMajor}), received ${nodeVersion}.`);
}

if (pnpmVersion !== expectedPnpmVersion) {
  errors.push(`Expected pnpm ${expectedPnpmVersion}, received ${pnpmVersion}.`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error('Run `volta install node@20.19.0 pnpm@9.15.9` or switch with `.nvmrc` before continuing.');
  process.exit(1);
}

console.log(`Runtime check passed: Node ${nodeVersion}, pnpm ${pnpmVersion}.`);
