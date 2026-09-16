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
  assert.deepEqual(validateSponsorLedger(ledger), { periods: 0, recognition: 0 });
});

test("sponsor ledger reconciles costs and transfers all net profit", () => {
  const sample = { ...ledger, periods: [validPeriod] };
  assert.deepEqual(validateSponsorLedger(sample), { periods: 1, recognition: 0 });

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
