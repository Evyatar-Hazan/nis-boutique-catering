#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const required = new Map([
  ["docs/cloudflare-operations-runbook.md", [
    "100,000", "5,000,000", "3,500,000", "4,250,000", "10 GB-month",
    "api_request", "publish_job", "time-travel info", "time-travel restore",
    "DELETE FROM admin_sessions", "POST /api/publish/retry", "POST /api/publish/rollback",
    "PRAGMA foreign_key_check", "0 orphan objects",
  ]],
  ["scripts/check-cloudflare-usage.mjs", [
    "workersRequestsDaily", "d1RowsReadDaily", "d1RowsWrittenDaily",
    "d1StorageBytes", "r2OperationsMonthly", "r2StorageBytes",
    "--simulate=", "process.exitCode = 2",
  ]],
  [".github/workflows/cloudflare-usage-monitor.yml", [
    "schedule:", "workflow_dispatch:", "CLOUDFLARE_API_TOKEN",
    "check-cloudflare-usage.mjs",
  ]],
]);

for (const [path, fragments] of required) {
  const contents = await readFile(path, "utf8");
  for (const fragment of fragments) {
    if (!contents.includes(fragment)) {
      throw new Error(`${path} is missing required runbook contract: ${fragment}`);
    }
  }
  if (/\b(?:TODO|TBD|FIXME)\b/u.test(contents)) {
    throw new Error(`${path} contains an unresolved placeholder.`);
  }
}

console.log("Cloudflare operations runbook contract is complete.");
