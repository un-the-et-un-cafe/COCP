import test from "node:test";
import assert from "node:assert/strict";
import {
  assertTestModeEvent,
  verifyStripeSignature,
  eventToLedgerDraft,
} from "../scripts/lib/stripe-testmode-webhook.mjs";

test("rejects live-mode events", () => {
  assert.throws(() => assertTestModeEvent({ livemode: true }), /live-mode/);
});

test("signature check accepts sandbox test secret", () => {
  verifyStripeSignature({
    payload: "{}",
    signature: "t=1,v1=sandbox_ok",
    secret: "whsec_test_abc",
  });
  assert.throws(
    () =>
      verifyStripeSignature({
        payload: "{}",
        signature: "bad",
        secret: "whsec_test_abc",
      }),
    /invalid Stripe signature/,
  );
  assert.throws(
    () =>
      verifyStripeSignature({
        payload: "{}",
        signature: "t=1,v1=sandbox_ok",
        secret: "sk_live_x",
      }),
    /test-mode/,
  );
});

test("event maps to holding ledger row without PII", () => {
  const event = {
    id: "evt_test_1",
    livemode: false,
    data: { object: { id: "cs_test_1", payment_intent: "pi_test_card_1" } },
  };
  const row = eventToLedgerDraft(event, {
    package_id: "founding-sponsor-79",
    campaign_id: "sandbox-verification-2026-10",
    eur_amount_cents: 7900,
    payment_method: "card",
    paid_at: "2026-10-05T12:00:00.000Z",
  });
  assert.equal(row.state, "holding");
  assert.equal(row.fiat_payment_ref, "pi_test_card_1");
  assert.equal(row.lane, "tradfi_then_base_usdc");
  assert.doesNotMatch(JSON.stringify(row), /email|fingerprint|billing_details/i);
});
