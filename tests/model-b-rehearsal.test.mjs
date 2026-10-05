import test from "node:test";
import assert from "node:assert/strict";
import { rehearseModelBSettlement } from "../scripts/rehearse-settlement-payout.mjs";

test("synthetic TradFi cleared → testnet USDC 90% row fields present", () => {
  const row = rehearseModelBSettlement({
    eur_amount_cents: 7900,
    package_id: "founding-sponsor-79",
    campaign_id: "sandbox-verification-2026-10",
    fiat_payment_ref: "SYN-CARD-20261005-0001",
    refund_window_closed: true,
    settlement_tx_hash: "0xsandboxdeadbeef000000000000000000000000000000000000000000000001",
  });
  assert.equal(row.lane, "tradfi_then_base_usdc");
  assert.equal(row.fiat_payment_ref, "SYN-CARD-20261005-0001");
  assert.equal(row.eur_amount_cents, 7900);
  assert.equal(row.split_90_10.charity_eur_cents, 7110);
  assert.equal(row.split_90_10.admin_eur_cents, 790);
  assert.equal(row.usdc_amount_micro, 71_100_000);
  assert.ok(row.settlement_tx_hash.startsWith("0x"));
  assert.equal(row.admin_remains_eur, true);
  assert.match(row.casp_note, /authorised CASP/i);
  assert.doesNotMatch(JSON.stringify(row), /email|phone|walletAddress|identityDocument/i);
});

test("refuses settlement before refund window closes", () => {
  assert.throws(
    () =>
      rehearseModelBSettlement({
        eur_amount_cents: 7900,
        package_id: "x",
        campaign_id: "y",
        fiat_payment_ref: "z",
        refund_window_closed: false,
      }),
    /refund window/,
  );
});
