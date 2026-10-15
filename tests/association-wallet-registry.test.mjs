import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  validateAssociationWalletRegistry,
  findEligibleAssociation,
} from "../scripts/validate-association-wallet-registry.mjs";

const doc = JSON.parse(
  await readFile(new URL("../web/data/association-wallet-registry.sandbox.json", import.meta.url), "utf8"),
);

test("sandbox registry validates with dual reviewers and fictional flag", () => {
  const r = validateAssociationWalletRegistry(doc);
  assert.ok(r.entries >= 1);
  assert.ok(r.active >= 1);
});

test("rejects same reviewer twice and non-fictional entries", () => {
  const bad = structuredClone(doc);
  bad.entries[0].reviewer_b = bad.entries[0].reviewer_a;
  assert.throws(() => validateAssociationWalletRegistry(bad), /reviewer_a must differ/);
  const bad2 = structuredClone(doc);
  bad2.entries[0].fictional = false;
  assert.throws(() => validateAssociationWalletRegistry(bad2), /fictional must be true/);
});

test("beneficiary home source has no association wallet addresses", async () => {
  const page = await readFile(new URL("../web/app/page.tsx", import.meta.url), "utf8");
  for (const e of doc.entries) {
    assert.equal(page.includes(e.wallet_address), false);
  }
});
