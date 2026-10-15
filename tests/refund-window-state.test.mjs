import test from "node:test";
import assert from "node:assert/strict";
import {
  createPaidSponsorship,
  enterHolding,
  maybeClearAfterWindow,
  markRefunded,
  markDisputed,
  queuePayout,
  markSettled,
  assertTransition,
  releaseDispute,
} from "../scripts/lib/refund-window-state.mjs";

const base = () =>
  createPaidSponsorship({
    fiat_payment_ref: "pi_test_1",
    package_id: "founding-sponsor-79",
    campaign_id: "c1",
    eur_amount_cents: 7900,
    payment_method: "card",
    paid_at: "2026-10-01T00:00:00.000Z",
  });

test("legal transitions paid→holding→cleared→payout_queued→settled", () => {
  let row = base();
  row = enterHolding(row, row.paid_at);
  assert.equal(row.state, "holding");
  row = maybeClearAfterWindow(row, {
    now: Date.parse("2026-10-16T00:00:00.000Z"),
    refund_window_days: 14,
  });
  assert.equal(row.state, "cleared");
  row = queuePayout(row, "2026-10-16T01:00:00.000Z");
  row = markSettled(row, {
    settlement_tx_hash: "0x" + "ab".repeat(32),
    at: "2026-10-16T02:00:00.000Z",
  });
  assert.equal(row.state, "settled");
});

test("rejects illegal paid→settled", () => {
  assert.throws(() => assertTransition("paid", "settled"), /illegal transition/);
});

test("holding before window stays holding", () => {
  let row = enterHolding(base(), "2026-10-01T00:00:00.000Z");
  row = maybeClearAfterWindow(row, {
    now: Date.parse("2026-10-05T00:00:00.000Z"),
    refund_window_days: 14,
  });
  assert.equal(row.state, "holding");
});

test("refund and dispute paths", () => {
  let row = enterHolding(base(), "2026-10-01T00:00:00.000Z");
  const refunded = markRefunded(row, "2026-10-02T00:00:00.000Z");
  assert.equal(refunded.state, "refunded");
  row = enterHolding(base(), "2026-10-01T00:00:00.000Z");
  const disputed = markDisputed(row, "2026-10-02T00:00:00.000Z");
  assert.equal(disputed.state, "disputed");
  const released = releaseDispute(disputed, "2026-10-10T00:00:00.000Z");
  assert.equal(released.state, "cleared");
});

test("ledger draft has no PII keys", () => {
  const row = base();
  assert.doesNotMatch(JSON.stringify(row), /email|fingerprint|billing/i);
});
