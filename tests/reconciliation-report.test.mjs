import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildReconciliationReport,
  assertReportOk,
} from "../scripts/generate-reconciliation-report.mjs";

test("good fixture passes reconciliation", async () => {
  const fixture = JSON.parse(
    await readFile(new URL("../web/data/fixtures/reconciliation-good.sandbox.json", import.meta.url), "utf8"),
  );
  const report = buildReconciliationReport(fixture.rows, { period: "2026-10" });
  assertReportOk(report);
  assert.equal(report.ok, true);
  assert.ok(report.totals.usdc_settled_micro > 0);
  assert.ok(report.totals.eur_refunds_cents > 0);
});

test("mismatch fixture fails", async () => {
  const fixture = JSON.parse(
    await readFile(
      new URL("../web/data/fixtures/reconciliation-mismatch.sandbox.json", import.meta.url),
      "utf8",
    ),
  );
  const report = buildReconciliationReport(fixture.rows, { period: "2026-10" });
  assert.equal(report.ok, false);
  assert.throws(() => assertReportOk(report), /reconciliation mismatch/);
});
