import test from "node:test";
import assert from "node:assert/strict";
import {
  createTestnetDirectProvider,
  createCaspProvider,
  buildPayoutBatch,
} from "../scripts/lib/payout/providers.mjs";
import { readFile } from "node:fs/promises";
import { findEligibleAssociation, validateAssociationWalletRegistry } from "../scripts/validate-association-wallet-registry.mjs";

const registry = JSON.parse(
  await readFile(new URL("../web/data/association-wallet-registry.sandbox.json", import.meta.url), "utf8"),
);

test("TestnetDirectProvider settles with two approvers", async () => {
  validateAssociationWalletRegistry(registry);
  const association = findEligibleAssociation(registry, "sandbox-asso-alpha");
  const batch = buildPayoutBatch({
    batch_id: "b1",
    association,
    clearedRows: [
      { fiat_payment_ref: "a", eur_amount_cents: 7900, state: "cleared" },
      { fiat_payment_ref: "b", eur_amount_cents: 7900, state: "cleared" },
    ],
    approver_a: "op-a",
    approver_b: "op-b",
    approved_at: "2026-10-05T18:00:00.000Z",
  });
  assert.equal(batch.charity_eur_cents_total, 14220);
  assert.equal(batch.admin_eur_cents_total, 1580);
  const provider = createTestnetDirectProvider();
  const result = await provider.settleCharityLeg(batch);
  assert.equal(result.provider_id, "testnet_direct");
  assert.match(result.settlement_tx_hash, /^0x[0-9a-fA-F]{64}$/);
});

test("rejects single-approver batch at provider gate", async () => {
  const association = findEligibleAssociation(registry, "sandbox-asso-alpha");
  const batch = buildPayoutBatch({
    batch_id: "b2",
    association,
    clearedRows: [{ fiat_payment_ref: "a", eur_amount_cents: 7900, state: "cleared" }],
    approver_a: "op-a",
    approver_b: "op-a",
    approved_at: "2026-10-05T18:00:00.000Z",
  });
  const provider = createTestnetDirectProvider();
  await assert.rejects(() => provider.settleCharityLeg(batch), /approvers must be distinct/);
});

test("CaspProvider throws CASP_NOT_CONFIGURED when unconfigured", async () => {
  const provider = createCaspProvider();
  await assert.rejects(() => provider.settleCharityLeg({}), (err) => {
    assert.equal(err.message, "CASP_NOT_CONFIGURED");
    return true;
  });
});

test("payout refuses mou_flag false association", () => {
  const bad = structuredClone(registry);
  bad.entries[0].mou_flag = false;
  assert.throws(() => findEligibleAssociation(bad, "sandbox-asso-alpha"), /mou_flag false/);
});
