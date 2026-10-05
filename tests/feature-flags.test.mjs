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

test("committed feature flags keep all payment lanes fail-closed", () => {
  const result = validateFeatureFlags(flagsDoc, register);
  assert.equal(result.paymentFlagsOpen, false);
  assert.equal(result.gatesComplete, false);
  assert.equal(flagsDoc.flags.payments_card, false);
  assert.equal(flagsDoc.flags.payments_sepa, false);
  assert.equal(flagsDoc.flags.payments_base_mainnet, false);
  assert.equal(flagsDoc.flags.payments_base_testnet_ui, false);
  assert.equal(flagsDoc.flags.activity_payments, false);
  assert.equal(flagsDoc.flags.voucher_pilot, false);
  assert.equal(flagsDoc.flags.activity_intake, false);
  assert.equal(flagsDoc.flags.sponsor_evidence_pack, true);
  assert.equal(flagsDoc.flags.print_qr_generator, true);
  assert.equal(flagsDoc.flags.listing_qa_dashboard, true);
});

test("payments true while launch gates blocked fails closed", () => {
  for (const key of [
    "payments_card",
    "payments_sepa",
    "payments_base_testnet_ui",
    "activity_payments",
  ]) {
    const bad = copyFlags();
    bad.flags[key] = true;
    assert.throws(
      () => validateFeatureFlags(bad, copyRegister()),
      /cannot be true while launch gates are incomplete/,
    );
  }
});

test("payments_base_mainnet is always rejected in this slice", () => {
  const bad = copyFlags();
  bad.flags.payments_base_mainnet = true;
  // Even with gates still blocked, mainnet is hard-banned
  assert.throws(() => validateFeatureFlags(bad, copyRegister()), /mainnet|cannot be true|must stay false/i);
});
