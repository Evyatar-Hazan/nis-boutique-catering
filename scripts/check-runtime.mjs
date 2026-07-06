const supportedNodeMajors = [24, 25];
const preferredNodeVersion = '24.11.0';
const expectedPnpmVersion = '9.15.9';

const nodeVersion = process.versions.node;
const nodeMajor = Number.parseInt(nodeVersion.split('.')[0] ?? '', 10);
const userAgent = process.env.npm_config_user_agent ?? '';
const pnpmMatch = /pnpm\/([0-9.]+)/.exec(userAgent);
const pnpmVersion = pnpmMatch?.[1] ?? 'unknown';

const errors = [];

if (!supportedNodeMajors.includes(nodeMajor)) {
  errors.push(`Expected Node ${preferredNodeVersion} or a supported compatible major (${supportedNodeMajors.join(', ')}), received ${nodeVersion}.`);
}

if (pnpmVersion !== expectedPnpmVersion) {
  errors.push(`Expected pnpm ${expectedPnpmVersion}, received ${pnpmVersion}.`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  console.error(`Run \`volta install node@${preferredNodeVersion} pnpm@${expectedPnpmVersion}\` or switch with \`.nvmrc\` before continuing.`);
  process.exit(1);
}

console.log(`Runtime check passed: Node ${nodeVersion}, pnpm ${pnpmVersion}.`);
