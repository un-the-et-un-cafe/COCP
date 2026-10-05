import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  splitEurCents,
  eurCentsToUsdcMicro,
  assertBeneficiaryNotAdmin,
  assertFeeCap,
} from "./lib/settlement-math.mjs";

/**
 * Simulate cleared TradFi sponsorship → testnet USDC 90% charity leg.
 * Does NOT connect a sponsor wallet. Does NOT perform live conversion
 * (CASP required in production — sandbox uses 1:1 stub).
 */
export function rehearseModelBSettlement(input) {
  const {
    eur_amount_cents,
    package_id,
    campaign_id,
    fiat_payment_ref,
    refund_window_closed,
    association_test_account = "0xAssociationTest000000000000000000000001",
    admin_test_account = "0xAdminTest000000000000000000000000000002",
    fee_bps = 0,
    settlement_tx_hash = null,
  } = input;

  if (!refund_window_closed) throw new Error("refund window must be closed before settlement");
  assertFeeCap(fee_bps);
  assertBeneficiaryNotAdmin(association_test_account, admin_test_account);

  const split = splitEurCents(eur_amount_cents);
  const usdc_amount_micro = eurCentsToUsdcMicro(split.charity_eur_cents);

  const row = {
    version: 1,
    synthetic: true,
    lane: "tradfi_then_base_usdc",
    package_id,
    campaign_id,
    fiat_payment_ref,
    eur_amount_cents,
    refund_window_closed: true,
    split_90_10: {
      charity_bps: split.charity_bps,
      admin_bps: split.admin_bps,
      charity_eur_cents: split.charity_eur_cents,
      admin_eur_cents: split.admin_eur_cents,
    },
    usdc_amount_micro,
    settlement_network: "base-sepolia",
    settlement_tx_hash:
      settlement_tx_hash ??
      `0xsandbox${Buffer.from(fiat_payment_ref).toString("hex").slice(0, 56).padEnd(56, "0")}`,
    // Aggregate labels only — no PII, no wallet key names (ledger forbid list)
    association_label: "test-association",
    admin_remains_eur: true,
    casp_note:
      "Sandbox stub conversion 1:1. Production EUR→USDC must use an authorised CASP partner — not DIY custody/exchange.",
    recorded_at: new Date().toISOString(),
  };
  return row;
}

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const row = rehearseModelBSettlement({
    eur_amount_cents: 7900,
    package_id: "founding-sponsor-79",
    campaign_id: "sandbox-verification-2026-10",
    fiat_payment_ref: "SYN-CARD-20261005-0001",
    refund_window_closed: true,
  });

  const outPath = resolve(root, "web/data/settlement-rehearsal.draft.json");
  await mkdir(resolve(root, "web/data"), { recursive: true });
  let existing = { version: 1, network: "base-sepolia", rows: [] };
  try {
    existing = JSON.parse(await readFile(outPath, "utf8"));
  } catch {
    /* fresh */
  }
  existing.rows = [...(existing.rows ?? []).filter((r) => r.fiat_payment_ref !== row.fiat_payment_ref), row];
  existing.updated_at = row.recorded_at;
  await writeFile(outPath, `${JSON.stringify(existing, null, 2)}\n`);
  console.log(
    `Model B rehearsal row written: fiat=${row.fiat_payment_ref} usdc_micro=${row.usdc_amount_micro} tx=${row.settlement_tx_hash}`,
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
