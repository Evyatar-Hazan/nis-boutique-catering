import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const trackerPath = resolve(import.meta.dirname, '../docs/public-site-redesign-tracker.md');
const tracker = readFileSync(trackerPath, 'utf8');
const taskMatches = [...tracker.matchAll(/^#### ((?:GOV|ARC|UI|WEB|CF|MIG|ADM|QA|REL)-\d{3}) — .+$/gm)];
const taskIds = taskMatches.map((match) => match[1]);
const uniqueTaskIds = new Set(taskIds);
const decisionRows = [...tracker.matchAll(/^\| DEC-\d{3} \|.+\| (Open|Decided) \|/gm)];
const taskStatuses = [...tracker.matchAll(/^- \*\*Status:\*\* `([A-Z_]+)`$/gm)].map((match) => match[1]);
const isCompleted = tracker.includes('status: completed');
const errors = [];

if (taskIds.length !== 57) errors.push(`expected 57 tasks, found ${taskIds.length}`);
if (uniqueTaskIds.size !== taskIds.length) errors.push('duplicate task IDs found');

for (const label of ['Definition', 'Acceptance criteria', 'Verification', 'Evidence']) {
  const count = [...tracker.matchAll(new RegExp(`^- \\*\\*${label}(?: \\([^)]+\\))?:\\*\\*`, 'gm'))].length;
  if (count !== taskIds.length) errors.push(`expected ${taskIds.length} ${label} blocks, found ${count}`);
}

if (taskStatuses.length !== taskIds.length) errors.push(`expected ${taskIds.length} task statuses, found ${taskStatuses.length}`);
if (isCompleted) {
  if (taskStatuses.some((status) => status !== 'DONE')) errors.push('completed tracker has unfinished tasks');
  if (!tracker.includes('implementation_gate: closed')) errors.push('completed tracker gate is not closed');
  if (!tracker.includes('**סטטוס נוכחי: `COMPLETED`**')) errors.push('visible implementation gate is not COMPLETED');
} else {
  if (!tracker.includes('implementation_gate: ready')) errors.push('implementation gate is not ready');
  if (!tracker.includes('**סטטוס נוכחי: `READY`**')) errors.push('visible implementation gate is not READY');
}
if (decisionRows.some((match) => match[1] === 'Open')) errors.push('open implementation decisions remain');

const taskReferences = [...tracker.matchAll(/`((?:GOV|ARC|UI|WEB|CF|MIG|ADM|QA|REL)-\d{3})`/g)].map((match) => match[1]);
const unknownReferences = [...new Set(taskReferences.filter((taskId) => !uniqueTaskIds.has(taskId)))];
if (unknownReferences.length > 0) errors.push(`unknown task references: ${unknownReferences.join(', ')}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`Tracker error: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Tracker check passed: ${taskIds.length} unique tasks, ${decisionRows.length} decided implementation decisions, gate ${isCompleted ? 'COMPLETED' : 'READY'}.`);
}
