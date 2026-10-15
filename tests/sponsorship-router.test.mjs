import test from "node:test";
import assert from "node:assert/strict";
import {
  splitEurCents,
  eurCentsToUsdcMicro,
  assertFeeCap,
  assertBeneficiaryNotAdmin,
  MAX_FEE_BPS,
} from "../scripts/lib/settlement-math.mjs";
import { readFile } from "node:fs/promises";

test("90/10 split math on EUR cents", () => {
  assert.deepEqual(splitEurCents(7900), {
    charity_eur_cents: 7110,
    admin_eur_cents: 790,
    charity_bps: 9000,
    admin_bps: 1000,
  });
  assert.equal(splitEurCents(10000).charity_eur_cents, 9000);
});

test("fee cap rejects values above 1000 bps", () => {
  assert.doesNotThrow(() => assertFeeCap(0));
  assert.doesNotThrow(() => assertFeeCap(MAX_FEE_BPS));
  assert.throws(() => assertFeeCap(1001), /feeBps/);
});

test("beneficiary must not equal admin", () => {
  assert.throws(
    () => assertBeneficiaryNotAdmin("0xAbc", "0xabc"),
    /beneficiary must not equal admin/,
  );
});

test("sandbox USDC conversion stub is 1:1 on charity leg", () => {
  const { charity_eur_cents } = splitEurCents(7900);
  assert.equal(eurCentsToUsdcMicro(charity_eur_cents), 71_100_000);
});

test("SponsorshipRouter.sol encodes Model B payout helper invariants", async () => {
  const src = await readFile(new URL("../contracts/src/SponsorshipRouter.sol", import.meta.url), "utf8");
  assert.match(src, /feeBps_ > 1000/);
  assert.match(src, /payoutCharityLeg/);
  assert.match(src, /BeneficiaryIsAdmin/);
  assert.doesNotMatch(src, /delegatecall|upgradeTo|mint\s*\(/i);
  assert.match(src, /NOT a sponsor checkout/i);
});

test("SponsorshipRouter requires verified association allow-list", async () => {
  const src = await readFile(new URL("../contracts/src/SponsorshipRouter.sol", import.meta.url), "utf8");
  assert.match(src, /allowedAssociation/);
  assert.match(src, /setAssociationAllowed/);
  assert.match(src, /AssociationNotAllowed/);
  assert.match(src, /operator/);
  assert.match(src, /OnChainFeeSettlement/);
});
