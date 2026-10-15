import { createHash } from "node:crypto";
import { eurCentsToUsdcMicro } from "../settlement-math.mjs";

function requireTwoApprovers(batch) {
  if (!batch.approver_a || !batch.approver_b) throw new Error("two approvers required");
  if (batch.approver_a === batch.approver_b) throw new Error("approvers must be distinct");
  if (!batch.approved_at) throw new Error("approved_at required");
  if (!batch.approval_statement) throw new Error("approval_statement required");
}

export function createTestnetDirectProvider({ executePayout } = {}) {
  return {
    id: "testnet_direct",
    async settleCharityLeg(batch) {
      requireTwoApprovers(batch);
      if (!batch.wallet_address) throw new Error("wallet_address required (from allow-list)");
      if (typeof executePayout === "function") {
        return executePayout(batch);
      }
      // Deterministic mock hash for CI without network
      const digest = createHash("sha256")
        .update(`testnet_direct:${batch.batch_id}:${batch.usdc_amount_micro}:${batch.wallet_address}`)
        .digest("hex");
      return {
        settlement_tx_hash: `0x${digest}`,
        provider_id: "testnet_direct",
        synthetic: true,
      };
    },
  };
}

export function createCaspProvider({ config } = {}) {
  return {
    id: "casp",
    async settleCharityLeg(_batch) {
      if (!config) {
        const err = new Error("CASP_NOT_CONFIGURED");
        err.code = "CASP_NOT_CONFIGURED";
        throw err;
      }
      throw new Error("CASP adapter not implemented in v0.2 — select authorised partner before production");
    },
  };
}

export function buildPayoutBatch({
  batch_id,
  association,
  clearedRows,
  approver_a,
  approver_b,
  approved_at,
  approval_statement = "sandbox rehearsal — fictional",
}) {
  if (!association?.mou_flag || !association.active) {
    throw new Error("association not eligible for payout");
  }
  if (!clearedRows?.length) throw new Error("clearedRows required");
  for (const r of clearedRows) {
    if (r.state !== "cleared" && r.state !== "payout_queued") {
      throw new Error(`row ${r.fiat_payment_ref} not cleared`);
    }
  }
  const charity_eur_cents_total = clearedRows.reduce(
    (sum, r) => sum + Math.floor((r.eur_amount_cents * 9000) / 10_000),
    0,
  );
  const admin_eur_cents_total = clearedRows.reduce((sum, r) => sum + r.eur_amount_cents, 0) - charity_eur_cents_total;
  return {
    batch_id,
    association_id: association.association_id,
    association_label: association.display_name,
    wallet_address: association.wallet_address,
    charity_eur_cents_total,
    admin_eur_cents_total, // stays EUR off-chain
    usdc_amount_micro: eurCentsToUsdcMicro(charity_eur_cents_total),
    fiat_payment_refs: clearedRows.map((r) => r.fiat_payment_ref),
    approver_a,
    approver_b,
    approved_at,
    approval_statement,
  };
}
