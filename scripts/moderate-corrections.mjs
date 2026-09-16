import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

const webRoot = fileURLToPath(new URL("../web", import.meta.url));
const input = process.argv.slice(2);
const flags = new Set(input.filter((item) => item.startsWith("--")));
const positionals = input.filter((item) => !item.startsWith("--"));
const [command, reportId] = positionals;
const production = flags.has("--prod");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function usage() {
  console.log(`Correction moderation

Usage:
  npm run corrections:review -- list [--show-messages]
  npm run corrections:review -- resolve <report-id> --confirm-reviewed
  npm run corrections:review -- dismiss <report-id> --confirm-reviewed

Production commands also require --prod --confirm-production.
Message text is hidden from list output unless --show-messages is supplied.`);
}

function convex(args) {
  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["--no-install", "convex", ...args],
    { cwd: webRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );

  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || "Convex command failed.";
    fail(detail);
  }
  return result.stdout.trim();
}

function deploymentArgs() {
  if (production && !flags.has("--confirm-production")) {
    fail("Production moderation requires --prod --confirm-production.");
  }
  return production ? ["--prod"] : [];
}

function pendingReports() {
  const output = convex(["run", "corrections:listPending", "{}", ...deploymentArgs()]);
  try {
    return JSON.parse(output);
  } catch {
    fail("Convex returned an unreadable pending-report response.");
  }
}

function date(value) {
  return typeof value === "number" ? new Date(value).toISOString() : null;
}

if (!command || flags.has("--help")) {
  usage();
  process.exit(flags.has("--help") ? 0 : 1);
}

if (command === "list") {
  const showMessages = flags.has("--show-messages");
  const reports = pendingReports().map((report) => ({
    reportId: report._id,
    listingId: report.listingId,
    reportType: report.reportType,
    language: report.language,
    submittedAt: date(report.submittedAt),
    expiresAt: date(report.expiresAt),
    message: showMessages ? report.message : `[hidden; ${report.message.length} characters]`,
  }));
  console.log(
    JSON.stringify(
      { deployment: production ? "production" : "development", count: reports.length, reports },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (command !== "resolve" && command !== "dismiss") {
  fail(`Unknown command: ${command}`);
}
if (!reportId) fail(`${command} requires a report ID.`);
if (!flags.has("--confirm-reviewed")) {
  fail(
    "Moderation requires --confirm-reviewed after checking the public fact and privacy boundary.",
  );
}

const reports = pendingReports();
if (!reports.some((report) => report._id === reportId)) {
  fail(
    `Pending correction report not found in the ${production ? "production" : "development"} deployment.`,
  );
}

const outcome = command === "resolve" ? "resolved" : "dismissed";
const result = convex([
  "run",
  "corrections:moderate",
  JSON.stringify({ reportId, outcome }),
  ...deploymentArgs(),
]);
console.log(result);
