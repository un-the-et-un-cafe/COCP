import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateSponsorLedger } from "../scripts/validate-sponsor-ledger.mjs";

const ledger = JSON.parse(
  await readFile(new URL("../web/data/sponsor-ledger.json", import.meta.url), "utf8"),
);

const validPeriod = {
  id: "2026-09",
  period_start: "2026-09-01T00:00:00Z",
  period_end: "2026-09-30T23:59:59Z",
  gross_revenue_cents: 10000,
  refunds_cents: 500,
  taxes_cents: 1000,
  payment_fees_cents: 300,
  operating_costs_cents: 1200,
  net_profit_cents: 7000,
  transfers: [
    {
      recipient_label: "Named local charity",
      recipient_type: "local_charity",
      amount_cents: 7000,
      transferred_at: "2026-10-05T10:00:00Z",
      evidence_url: "https://example.org/evidence/transfer",
    },
  ],
  deliverables: [
    {
      label: "Reviewed service records",
      count: 12,
      evidence_url: "https://example.org/evidence/deliverables",
    },
  ],
};

test("empty public sponsor ledger is valid and does not invent activity", () => {
  assert.deepEqual(validateSponsorLedger(ledger), { periods: 0, recognition: 0, model_b_settlements: 0 });
});

test("sponsor ledger reconciles costs and transfers all net profit", () => {
  const sample = { ...ledger, periods: [validPeriod] };
  assert.deepEqual(validateSponsorLedger(sample), { periods: 1, recognition: 0, model_b_settlements: 0 });

  const missingTransfer = structuredClone(sample);
  missingTransfer.periods[0].transfers[0].amount_cents = 6999;
  assert.throws(() => validateSponsorLedger(missingTransfer), /100% of net profit/);

  const wrongProfit = structuredClone(sample);
  wrongProfit.periods[0].net_profit_cents = 7001;
  assert.throws(() => validateSponsorLedger(wrongProfit), /does not reconcile/);
});

test("public sponsor ledger rejects personal fields and unconsented recognition", () => {
  assert.throws(
    () => validateSponsorLedger({ ...ledger, contact_email: "private@example.org" }),
    /not allowed/,
  );
  assert.throws(
    () =>
      validateSponsorLedger({
        ...ledger,
        recognition: [
          {
            display_name: "Example sponsor",
            consent: false,
            consented_at: "2026-09-01T00:00:00Z",
            expires_at: "2027-09-01T00:00:00Z",
          },
        ],
      }),
    /explicit consent/,
  );
});

test("model_b_settlements section accepts fiat_payment_ref + settlement_tx_hash via validateSponsorLedger", async () => {
  const { rehearseModelBSettlement } = await import("../scripts/rehearse-settlement-payout.mjs");
  const { validateSettlementRehearsalDraft } = await import("../scripts/validate-sponsor-ledger.mjs");
  const row = rehearseModelBSettlement({
    eur_amount_cents: 7900,
    package_id: "founding-sponsor-79",
    campaign_id: "sandbox-verification-2026-10",
    fiat_payment_ref: "SYN-CARD-20261005-0001",
    refund_window_closed: true,
  });
  assert.match(row.settlement_tx_hash, /^0x[0-9a-fA-F]{64}$/);
  const withSettlements = {
    ...ledger,
    model_b_settlements: [row],
  };
  assert.deepEqual(validateSponsorLedger(withSettlements), {
    periods: 0,
    recognition: 0,
    model_b_settlements: 1,
  });

  const withWalletKey = structuredClone(withSettlements);
  withWalletKey.model_b_settlements[0].association_wallet = "0x00000000000000000000000000000000000000b2";
  assert.throws(() => validateSponsorLedger(withWalletKey), /not allowed/);

  const draft = JSON.parse(
    await readFile(new URL("../web/data/settlement-rehearsal.draft.json", import.meta.url), "utf8"),
  );
  assert.equal(validateSettlementRehearsalDraft(draft).rows, draft.rows.length);
});
