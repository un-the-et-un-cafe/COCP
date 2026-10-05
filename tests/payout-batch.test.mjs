import test from "node:test";
import assert from "node:assert/strict";
import { buildPayoutBatch } from "../scripts/lib/payout/providers.mjs";
import { readFile } from "node:fs/promises";
import { findEligibleAssociation } from "../scripts/validate-association-wallet-registry.mjs";

const registry = JSON.parse(
  await readFile(new URL("../web/data/association-wallet-registry.sandbox.json", import.meta.url), "utf8"),
);

test("two cleared founding-sponsor payments batch to one association with 90/10", () => {
  const association = findEligibleAssociation(registry, "sandbox-asso-alpha");
  const batch = buildPayoutBatch({
    batch_id: "sandbox-batch-2026-10-alpha",
    association,
    clearedRows: [
      { fiat_payment_ref: "SYN-CARD-20261005-0001", eur_amount_cents: 7900, state: "cleared" },
      { fiat_payment_ref: "SYN-CARD-20261005-0002", eur_amount_cents: 7900, state: "cleared" },
    ],
    approver_a: "operator-sandbox-1",
    approver_b: "operator-sandbox-2",
    approved_at: "2026-10-05T18:00:00.000Z",
  });
  assert.equal(batch.fiat_payment_refs.length, 2);
  assert.equal(batch.charity_eur_cents_total, 14220);
  assert.equal(batch.admin_eur_cents_total, 1580);
  assert.equal(batch.usdc_amount_micro, 142_200_000);
  assert.match(batch.association_label, /FICTIONAL/);
});
