/**
 * Model B refund / dispute window state machine (pure).
 *
 * paid → holding → cleared → payout_queued → settled
 *              ↘ refunded
 *              ↘ disputed
 */

export const STATES = Object.freeze([
  "paid",
  "holding",
  "cleared",
  "payout_queued",
  "settled",
  "refunded",
  "disputed",
]);

const TRANSITIONS = {
  paid: ["holding", "refunded", "disputed"],
  holding: ["cleared", "refunded", "disputed"],
  cleared: ["payout_queued", "disputed"],
  payout_queued: ["settled", "disputed"],
  settled: [],
  refunded: [],
  disputed: ["cleared"], // release after dispute resolution
};

export function assertTransition(from, to) {
  const allowed = TRANSITIONS[from];
  if (!allowed) throw new Error(`unknown state: ${from}`);
  if (!allowed.includes(to)) {
    throw new Error(`illegal transition: ${from} → ${to}`);
  }
  return to;
}

export function createPaidSponsorship({
  fiat_payment_ref,
  package_id,
  campaign_id,
  eur_amount_cents,
  payment_method,
  paid_at,
}) {
  if (!["card", "sepa"].includes(payment_method)) throw new Error("payment_method must be card|sepa");
  if (!Number.isSafeInteger(eur_amount_cents) || eur_amount_cents <= 0) {
    throw new Error("eur_amount_cents must be positive integer");
  }
  return {
    fiat_payment_ref,
    package_id,
    campaign_id,
    eur_amount_cents,
    lane: "tradfi_then_base_usdc",
    payment_method,
    state: "paid",
    paid_at,
    holding_started_at: null,
    cleared_at: null,
    // No sponsor email / name / fingerprint on public artefacts
  };
}

export function enterHolding(row, at) {
  assertTransition(row.state, "holding");
  return { ...row, state: "holding", holding_started_at: at };
}

export function maybeClearAfterWindow(row, { now, refund_window_days }) {
  if (row.state !== "holding") throw new Error("maybeClearAfterWindow requires holding");
  const start = Date.parse(row.holding_started_at);
  const ms = refund_window_days * 24 * 60 * 60 * 1000;
  if (now < start + ms) return row;
  assertTransition(row.state, "cleared");
  return { ...row, state: "cleared", cleared_at: new Date(now).toISOString() };
}

export function markRefunded(row, at) {
  assertTransition(row.state, "refunded");
  return { ...row, state: "refunded", refunded_at: at };
}

export function markDisputed(row, at) {
  assertTransition(row.state, "disputed");
  return { ...row, state: "disputed", disputed_at: at };
}

export function queuePayout(row, at) {
  assertTransition(row.state, "payout_queued");
  return { ...row, state: "payout_queued", payout_queued_at: at };
}

export function markSettled(row, { settlement_tx_hash, at }) {
  assertTransition(row.state, "settled");
  if (!/^0x[0-9a-fA-F]{64}$/.test(settlement_tx_hash)) {
    throw new Error("settlement_tx_hash must be 0x+64 hex");
  }
  return { ...row, state: "settled", settlement_tx_hash, settled_at: at };
}

export function releaseDispute(row, at) {
  assertTransition(row.state, "cleared");
  return { ...row, state: "cleared", cleared_at: at, dispute_released_at: at };
}
