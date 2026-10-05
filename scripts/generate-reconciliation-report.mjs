import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * @param {Array<{state:string,eur_amount_cents:number,settlement_tx_hash?:string,fiat_payment_ref:string,usdc_amount_micro?:number}>} rows
 */
export function buildReconciliationReport(rows, { period = "2026-10" } = {}) {
  const totals = {
    eur_in_paid_cents: 0,
    eur_held_cents: 0,
    eur_cleared_cents: 0,
    eur_refunds_cents: 0,
    eur_disputed_cents: 0,
    eur_admin_retained_cents: 0,
    usdc_settled_micro: 0,
  };
  const mismatches = [];
  for (const row of rows) {
    const eur = row.eur_amount_cents ?? 0;
    switch (row.state) {
      case "paid":
        totals.eur_in_paid_cents += eur;
        break;
      case "holding":
        totals.eur_in_paid_cents += eur;
        totals.eur_held_cents += eur;
        break;
      case "cleared":
      case "payout_queued":
        totals.eur_in_paid_cents += eur;
        totals.eur_cleared_cents += eur;
        totals.eur_admin_retained_cents += eur - Math.floor((eur * 9000) / 10_000);
        break;
      case "settled": {
        totals.eur_in_paid_cents += eur;
        totals.eur_cleared_cents += eur;
        const charity = Math.floor((eur * 9000) / 10_000);
        totals.eur_admin_retained_cents += eur - charity;
        totals.usdc_settled_micro += row.usdc_amount_micro ?? charity * 10_000;
        if (!row.settlement_tx_hash || !row.fiat_payment_ref) {
          mismatches.push({ fiat_payment_ref: row.fiat_payment_ref, reason: "missing_ref_or_hash" });
        } else if (row._force_mismatch) {
          mismatches.push({ fiat_payment_ref: row.fiat_payment_ref, reason: "forced_mismatch" });
        }
        break;
      }
      case "refunded":
        totals.eur_refunds_cents += eur;
        break;
      case "disputed":
        totals.eur_disputed_cents += eur;
        break;
      default:
        mismatches.push({ fiat_payment_ref: row.fiat_payment_ref, reason: `unknown_state:${row.state}` });
    }
  }
  return {
    version: 1,
    period,
    synthetic: true,
    totals,
    mismatches,
    ok: mismatches.length === 0,
    row_count: rows.length,
  };
}

export function assertReportOk(report) {
  if (!report.ok) throw new Error(`reconciliation mismatch: ${JSON.stringify(report.mismatches)}`);
  return report;
}

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const fixturePath = resolve(root, "web/data/fixtures/reconciliation-good.sandbox.json");
  let rows;
  try {
    rows = JSON.parse(await readFile(fixturePath, "utf8")).rows;
  } catch {
    rows = [
      {
        fiat_payment_ref: "SYN-CARD-20261005-0001",
        state: "settled",
        eur_amount_cents: 7900,
        usdc_amount_micro: 71_100_000,
        settlement_tx_hash: "0xadddb0d97534f40e71344bc1e01c1785d8dfb297b709141f5b81709ba654e4bd",
      },
    ];
  }
  const report = buildReconciliationReport(rows, { period: "2026-10" });
  assertReportOk(report);
  const outDir = resolve(root, "web/data/reconciliation");
  await mkdir(outDir, { recursive: true });
  await writeFile(resolve(outDir, "2026-10.sandbox.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote reconciliation report 2026-10 ok=${report.ok}`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
