import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateFeatureFlags } from "../scripts/validate-feature-flags.mjs";

const flagsDoc = JSON.parse(
  await readFile(new URL("../web/data/feature-flags.json", import.meta.url), "utf8"),
);
const register = JSON.parse(
  await readFile(new URL("../web/data/launch-gates.json", import.meta.url), "utf8"),
);

function copyFlags() {
  return structuredClone(flagsDoc);
}
function copyRegister() {
  return structuredClone(register);
}

test("committed feature flags keep all production payment lanes fail-closed", () => {
  const result = validateFeatureFlags(flagsDoc, register);
  assert.equal(result.paymentFlagsOpen, false);
  assert.equal(result.gatesComplete, false);
  assert.equal(flagsDoc.version, 2);
  assert.equal(flagsDoc.flags.payments_card, false);
  assert.equal(flagsDoc.flags.payments_sepa, false);
  assert.equal(flagsDoc.flags.payments_base_mainnet, false);
  assert.equal(flagsDoc.flags.payments_base_testnet_ui, false);
  assert.equal(flagsDoc.flags.payments_card_testmode_ui, false);
  assert.equal(flagsDoc.flags.payments_sepa_testmode_ui, false);
  assert.equal(flagsDoc.flags.activity_payments, false);
  assert.equal(flagsDoc.flags.day_rhythm_categories, true);
});

test("production payments true while launch gates blocked fails closed", () => {
  for (const key of ["payments_card", "payments_sepa", "payments_base_testnet_ui", "activity_payments"]) {
    const bad = copyFlags();
    bad.flags[key] = true;
    assert.throws(
      () => validateFeatureFlags(bad, copyRegister()),
      /cannot be true while launch gates are incomplete/,
    );
  }
});

test("sandbox testmode UI may be true without opening production lanes", () => {
  const ok = copyFlags();
  ok.flags.payments_card_testmode_ui = true;
  ok.flags.payments_sepa_testmode_ui = true;
  const result = validateFeatureFlags(ok, copyRegister(), Date.now(), {});
  assert.equal(result.paymentFlagsOpen, false);
  assert.equal(result.sandboxUiOpen, true);
});

test("live Stripe keys rejected when testmode UI is on", () => {
  const ok = copyFlags();
  ok.flags.payments_card_testmode_ui = true;
  assert.throws(
    () => validateFeatureFlags(ok, copyRegister(), Date.now(), { STRIPE_SECRET_KEY: "sk_live_xxx" }),
    /live Stripe keys/,
  );
});

test("payments_base_mainnet is always rejected in this slice", () => {
  const bad = copyFlags();
  bad.flags.payments_base_mainnet = true;
  assert.throws(() => validateFeatureFlags(bad, copyRegister()), /mainnet|cannot be true|must stay false/i);
});
