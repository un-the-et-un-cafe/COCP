#!/usr/bin/env node
/**
 * Operator payout batch CLI. Dry-run by default.
 * --execute-sandbox uses TestnetDirectProvider (mock hash, no network unless wired).
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  createTestnetDirectProvider,
  createCaspProvider,
  buildPayoutBatch,
} from "./lib/payout/providers.mjs";
import { findEligibleAssociation, validateAssociationWalletRegistry } from "./validate-association-wallet-registry.mjs";
import { queuePayout, markSettled } from "./lib/refund-window-state.mjs";

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const execute = process.argv.includes("--execute-sandbox");
  const useCasp = process.argv.includes("--casp");

  const flags = JSON.parse(await readFile(resolve(root, "web/data/feature-flags.json"), "utf8"));
  if (!flags.flags.payout_queue_sandbox && execute) {
    throw new Error("payout_queue_sandbox flag is false — refusing execute");
  }

  const registry = JSON.parse(
    await readFile(resolve(root, "web/data/association-wallet-registry.sandbox.json"), "utf8"),
  );
  validateAssociationWalletRegistry(registry);
  const association = findEligibleAssociation(registry, "sandbox-asso-alpha");

  // Fixture cleared rows (synthetic)
  let rows = [
    {
      fiat_payment_ref: "SYN-CARD-20261005-0001",
      package_id: "founding-sponsor-79",
      campaign_id: "sandbox-verification-2026-10",
      eur_amount_cents: 7900,
      state: "cleared",
      lane: "tradfi_then_base_usdc",
    },
    {
      fiat_payment_ref: "SYN-CARD-20261005-0002",
      package_id: "founding-sponsor-79",
      campaign_id: "sandbox-verification-2026-10",
      eur_amount_cents: 7900,
      state: "cleared",
      lane: "tradfi_then_base_usdc",
    },
  ];

  const batch = buildPayoutBatch({
    batch_id: "sandbox-batch-2026-10-alpha",
    association,
    clearedRows: rows,
    approver_a: "operator-sandbox-1",
    approver_b: "operator-sandbox-2",
    approved_at: "2026-10-05T18:00:00.000Z",
  });

  console.log(
    `Batch ${batch.batch_id}: charity_eur_cents=${batch.charity_eur_cents_total} usdc_micro=${batch.usdc_amount_micro} refs=${batch.fiat_payment_refs.length}`,
  );

  if (!execute) {
    console.log("Dry-run only. Pass --execute-sandbox to settle via TestnetDirectProvider.");
    return;
  }

  const provider = useCasp ? createCaspProvider() : createTestnetDirectProvider();
  rows = rows.map((r) => queuePayout(r, "2026-10-05T18:00:00.000Z"));
  const result = await provider.settleCharityLeg(batch);
  rows = rows.map((r) =>
    markSettled(r, { settlement_tx_hash: result.settlement_tx_hash, at: "2026-10-05T18:01:00.000Z" }),
  );

  const outDir = resolve(root, "web/data/reconciliation");
  await mkdir(outDir, { recursive: true });
  const out = {
    version: 1,
    batch,
    result,
    rows: rows.map(({ fiat_payment_ref, state, settlement_tx_hash, eur_amount_cents }) => ({
      fiat_payment_ref,
      state,
      settlement_tx_hash,
      eur_amount_cents,
    })),
  };
  // Strip wallet from public artefact
  delete out.batch.wallet_address;
  await writeFile(resolve(outDir, "last-payout-batch.sandbox.json"), `${JSON.stringify(out, null, 2)}\n`);
  console.log(`Settled via ${result.provider_id}: ${result.settlement_tx_hash}`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main();
}
