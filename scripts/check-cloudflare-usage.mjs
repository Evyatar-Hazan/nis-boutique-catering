#!/usr/bin/env node

const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

const thresholds = Object.freeze({
  d1RowsReadDaily: { warning: 3_500_000, critical: 4_250_000 },
  d1RowsWrittenDaily: { warning: 70_000, critical: 85_000 },
  d1StorageBytes: { warning: 3_500_000_000, critical: 4_250_000_000 },
  r2OperationsMonthly: { warning: 700_000, critical: 850_000 },
  r2StorageBytes: { warning: 7_000_000_000, critical: 8_500_000_000 },
  workersRequestsDaily: { warning: 70_000, critical: 85_000 },
});

const sum = (items, read) => items.reduce((total, item) => total + read(item), 0);

const classify = (value, limit) => {
  if (value >= limit.critical) return "critical";
  if (value >= limit.warning) return "warning";
  return "ok";
};

const buildReport = (usage) => {
  const metrics = Object.fromEntries(
    Object.entries(usage).map(([name, value]) => [name, {
      level: classify(value, thresholds[name]),
      thresholds: thresholds[name],
      value,
    }]),
  );
  const levels = Object.values(metrics).map(({ level }) => level);
  return {
    checkedAt: new Date().toISOString(),
    level: levels.includes("critical")
      ? "critical"
      : levels.includes("warning")
        ? "warning"
        : "ok",
    metrics,
  };
};

const simulatedUsage = (mode) => {
  if (mode === "safe") {
    return {
      d1RowsReadDaily: 1_000,
      d1RowsWrittenDaily: 20,
      d1StorageBytes: 10_000_000,
      r2OperationsMonthly: 300,
      r2StorageBytes: 10_000_000,
      workersRequestsDaily: 500,
    };
  }
  if (mode === "critical") {
    return Object.fromEntries(
      Object.entries(thresholds).map(([name, value]) => [name, value.critical]),
    );
  }
  throw new Error("--simulate must be safe or critical.");
};

const queryUsage = async () => {
  const accountTag = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountTag || !token) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required.");
  }

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const date = dayStart.toISOString().slice(0, 10);
  const query = `
    query Usage($accountTag: string!, $dayStart: Time!, $now: Time!, $date: Date!, $monthStart: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          workersInvocationsAdaptive(limit: 10000, filter: { datetime_geq: $dayStart, datetime_leq: $now }) {
            sum { requests }
          }
          d1AnalyticsAdaptiveGroups(limit: 10000, filter: { date_geq: $date, date_leq: $date }) {
            sum { rowsRead rowsWritten }
          }
          r2OperationsAdaptiveGroups(limit: 10000, filter: { datetime_geq: $monthStart, datetime_leq: $now }) {
            sum { requests }
          }
          r2StorageAdaptiveGroups(limit: 10000, filter: { datetime_geq: $monthStart, datetime_leq: $now }) {
            dimensions { bucketName }
            max { payloadSize }
          }
        }
      }
    }
  `;
  const response = await fetch(GRAPHQL_ENDPOINT, {
    body: JSON.stringify({
      query,
      variables: {
        accountTag,
        date,
        dayStart: dayStart.toISOString(),
        monthStart: monthStart.toISOString(),
        now: now.toISOString(),
      },
    }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    const messages = payload.errors?.map(({ message }) => message).join("; ");
    throw new Error(`Cloudflare Analytics query failed (${response.status}): ${messages || "unknown error"}`);
  }
  const account = payload.data?.viewer?.accounts?.[0];
  if (!account) throw new Error("Cloudflare Analytics returned no matching account.");

  const databasesResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountTag}/d1/database?per_page=1000`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const databasesPayload = await databasesResponse.json();
  if (!databasesResponse.ok || !databasesPayload.success) {
    throw new Error(`Cloudflare D1 inventory failed (${databasesResponse.status}).`);
  }

  return {
    d1RowsReadDaily: sum(account.d1AnalyticsAdaptiveGroups ?? [], ({ sum: values }) => values?.rowsRead ?? 0),
    d1RowsWrittenDaily: sum(account.d1AnalyticsAdaptiveGroups ?? [], ({ sum: values }) => values?.rowsWritten ?? 0),
    d1StorageBytes: sum(databasesPayload.result ?? [], ({ file_size: fileSize }) => fileSize ?? 0),
    r2OperationsMonthly: sum(account.r2OperationsAdaptiveGroups ?? [], ({ sum: values }) => values?.requests ?? 0),
    r2StorageBytes: sum(account.r2StorageAdaptiveGroups ?? [], ({ max }) => max?.payloadSize ?? 0),
    workersRequestsDaily: sum(account.workersInvocationsAdaptive ?? [], ({ sum: values }) => values?.requests ?? 0),
  };
};

const writeSummary = async (report) => {
  if (!process.env.GITHUB_STEP_SUMMARY) return;
  const rows = Object.entries(report.metrics)
    .map(([name, metric]) => `| ${name} | ${metric.value} | ${metric.level} | ${metric.thresholds.warning} | ${metric.thresholds.critical} |`)
    .join("\n");
  const markdown = `## Cloudflare usage: ${report.level}\n\n| Metric | Value | Level | Warning | Critical |\n|---|---:|---|---:|---:|\n${rows}\n`;
  const { appendFile } = await import("node:fs/promises");
  await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
};

const simulate = process.argv.find((argument) => argument.startsWith("--simulate="))?.split("=")[1];
const usage = simulate ? simulatedUsage(simulate) : await queryUsage();
const report = buildReport(usage);
console.log(JSON.stringify(report, null, 2));
await writeSummary(report);

if (report.level === "warning") console.warn("::warning::Cloudflare usage reached a warning threshold.");
if (report.level === "critical") {
  console.error("::error::Cloudflare usage reached a critical threshold.");
  process.exitCode = 2;
}
