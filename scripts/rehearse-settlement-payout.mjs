import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import {
  splitEurCents,
  eurCentsToUsdcMicro,
  assertBeneficiaryNotAdmin,
  assertFeeCap,
} from "./lib/settlement-math.mjs";

/** Deterministic ISO timestamp from fiat ref (committed drafts stay stable). */
export function deterministicRecordedAt(fiatPaymentRef) {
  const digest = createHash("sha256").update(`recorded_at:${fiatPaymentRef}`).digest();
  const seconds = digest.readUInt32BE(0) % 86400;
  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `2026-10-05T${hh}:${mm}:${ss}.000Z`;
}

export function syntheticSettlementTxHash(fiatPaymentRef, usdcAmountMicro) {
  const digest = createHash("sha256")
    .update(`synthetic-settlement:${fiatPaymentRef}:${usdcAmountMicro}`)
    .digest("hex");
  return `0x${digest}`;
}

function buildRow(input, txHash, viaRouter) {
  const {
    eur_amount_cents,
    package_id,
    campaign_id,
    fiat_payment_ref,
    refund_window_closed,
    association_test_account = "0x00000000000000000000000000000000000000b2",
    admin_test_account = "0x00000000000000000000000000000000000000c3",
    fee_bps = 0,
    recorded_at = null,
  } = input;

  if (!refund_window_closed) throw new Error("refund window must be closed before settlement");
  assertFeeCap(fee_bps); // reserved for secondary on-chain fee path; Model B default 0
  assertBeneficiaryNotAdmin(association_test_account, admin_test_account);

  const split = splitEurCents(eur_amount_cents);
  const usdc_amount_micro = eurCentsToUsdcMicro(split.charity_eur_cents);

  return {
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
    settlement_tx_hash: txHash,
    association_label: "test-association",
    admin_remains_eur: true,
    via_router: viaRouter,
    casp_note:
      "Sandbox stub conversion 1:1. Production EUR→USDC must use an authorised CASP partner — not DIY custody/exchange.",
    recorded_at: recorded_at ?? deterministicRecordedAt(fiat_payment_ref),
  };
}

/**
 * Sync Model B rehearsal (no network). Uses provided settlement_tx_hash or a
 * deterministic synthetic hash — never a raw 0xsandbox+fiat stub.
 */
export function rehearseModelBSettlement(input) {
  const split = splitEurCents(input.eur_amount_cents);
  const usdc_amount_micro = eurCentsToUsdcMicro(split.charity_eur_cents);
  const txHash =
    input.settlement_tx_hash ??
    syntheticSettlementTxHash(input.fiat_payment_ref, usdc_amount_micro);
  return buildRow(input, txHash, false);
}

/**
 * Async: run SponsorshipRouter.payoutCharityLeg on in-process EVM and record
 * the resulting settlement_tx_hash (real executed call, no network/keys).
 */
export async function rehearseModelBSettlementViaRouter(input) {
  const split = splitEurCents(input.eur_amount_cents);
  const usdc_amount_micro = eurCentsToUsdcMicro(split.charity_eur_cents);
  const association =
    input.association_test_account ?? "0x00000000000000000000000000000000000000b2";
  const { executeRouterPayoutOnEvm } = await import("../contracts/scripts/rehearse-payout-evm.mjs");
  const executed = await executeRouterPayoutOnEvm({
    association,
    amountMicro: usdc_amount_micro,
    fiatPaymentRef: input.fiat_payment_ref,
  });
  return buildRow(input, executed.settlement_tx_hash, true);
}

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const viaRouter = !process.argv.includes("--no-router");
  const input = {
    eur_amount_cents: 7900,
    package_id: "founding-sponsor-79",
    campaign_id: "sandbox-verification-2026-10",
    fiat_payment_ref: "SYN-CARD-20261005-0001",
    refund_window_closed: true,
  };
  const row = viaRouter
    ? await rehearseModelBSettlementViaRouter(input)
    : rehearseModelBSettlement(input);

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
    `Model B rehearsal row written: fiat=${row.fiat_payment_ref} usdc_micro=${row.usdc_amount_micro} tx=${row.settlement_tx_hash} via_router=${row.via_router}`,
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
