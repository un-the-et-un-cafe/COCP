import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const allowedRecipientTypes = new Set(["local_charity", "founder_housing_support"]);
// Reject PII / wallet keys on public ledger. Allow settlement_tx_hash, association_label, recipient_label.
const forbiddenKeys = /email|phone|wallet|address|ipAddress|referral|beneficiaryId|userId/i;

const MODEL_B_LANE = "tradfi_then_base_usdc";
const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

function requireText(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required.`);
}

function requireIsoDate(value, label) {
  requireText(value, label);
  if (Number.isNaN(Date.parse(value))) throw new Error(`${label} must be an ISO date.`);
}

function requireCents(value, label) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`${label} must be non-negative integer cents.`);
}

function inspectKeys(value, path = "ledger") {
  if (Array.isArray(value))
    return value.forEach((item, index) => inspectKeys(item, `${path}[${index}]`));
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (forbiddenKeys.test(key))
      throw new Error(`${path}.${key} is not allowed in the public ledger.`);
    inspectKeys(item, `${path}.${key}`);
  }
}

function validateModelBSettlement(row, path) {
  requireText(row.fiat_payment_ref, `${path}.fiat_payment_ref`);
  requireCents(row.eur_amount_cents, `${path}.eur_amount_cents`);
  if (row.eur_amount_cents <= 0) throw new Error(`${path}.eur_amount_cents must be positive.`);
  requireText(row.campaign_id, `${path}.campaign_id`);
  if (row.lane !== MODEL_B_LANE) throw new Error(`${path}.lane must be ${MODEL_B_LANE}.`);
  if (!row.split_90_10 || typeof row.split_90_10 !== "object") {
    throw new Error(`${path}.split_90_10 is required.`);
  }
  requireCents(row.split_90_10.charity_eur_cents, `${path}.split_90_10.charity_eur_cents`);
  requireCents(row.split_90_10.admin_eur_cents, `${path}.split_90_10.admin_eur_cents`);
  if (
    row.split_90_10.charity_eur_cents + row.split_90_10.admin_eur_cents !==
    row.eur_amount_cents
  ) {
    throw new Error(`${path}.split_90_10 must sum to eur_amount_cents.`);
  }
  if (!Number.isSafeInteger(row.usdc_amount_micro) || row.usdc_amount_micro < 0) {
    throw new Error(`${path}.usdc_amount_micro must be a non-negative integer.`);
  }
  requireText(row.settlement_tx_hash, `${path}.settlement_tx_hash`);
  if (!TX_HASH_RE.test(row.settlement_tx_hash)) {
    throw new Error(`${path}.settlement_tx_hash must be 0x + 64 hex.`);
  }
  if (row.synthetic === true) {
    // ok — sandbox / rehearsal
  } else if (row.synthetic !== false && row.synthetic !== undefined) {
    throw new Error(`${path}.synthetic must be boolean when set.`);
  }
  if (row.state !== undefined) {
    const allowed = new Set([
      "paid",
      "holding",
      "cleared",
      "payout_queued",
      "settled",
      "refunded",
      "disputed",
    ]);
    if (!allowed.has(row.state)) throw new Error(`${path}.state is invalid.`);
  }
}

export function validateSponsorLedger(ledger, now = Date.now()) {
  if (!ledger || typeof ledger !== "object") throw new Error("Sponsor ledger must be an object.");
  inspectKeys(ledger);
  if (ledger.version !== 1) throw new Error("Sponsor ledger version must be 1.");
  if (ledger.currency !== "EUR") throw new Error("Sponsor ledger currency must be EUR.");
  if (ledger.updated_at !== null) requireIsoDate(ledger.updated_at, "updated_at");
  if (!Array.isArray(ledger.periods)) throw new Error("Sponsor ledger periods must be an array.");
  if (!Array.isArray(ledger.recognition)) throw new Error("Sponsor recognition must be an array.");

  const periodIds = new Set();
  for (const period of ledger.periods) {
    requireText(period.id, "period.id");
    if (periodIds.has(period.id)) throw new Error(`Duplicate sponsor period: ${period.id}`);
    periodIds.add(period.id);
    requireIsoDate(period.period_start, `${period.id}.period_start`);
    requireIsoDate(period.period_end, `${period.id}.period_end`);
    if (Date.parse(period.period_end) < Date.parse(period.period_start)) {
      throw new Error(`${period.id} ends before it starts.`);
    }

    const amountKeys = [
      "gross_revenue_cents",
      "refunds_cents",
      "taxes_cents",
      "payment_fees_cents",
      "operating_costs_cents",
      "net_profit_cents",
    ];
    for (const key of amountKeys) requireCents(period[key], `${period.id}.${key}`);
    const expectedNet =
      period.gross_revenue_cents -
      period.refunds_cents -
      period.taxes_cents -
      period.payment_fees_cents -
      period.operating_costs_cents;
    if (expectedNet < 0 || expectedNet !== period.net_profit_cents) {
      throw new Error(`${period.id} net profit does not reconcile.`);
    }
    if (!Array.isArray(period.transfers))
      throw new Error(`${period.id}.transfers must be an array.`);
    const transferred = period.transfers.reduce((total, transfer, index) => {
      requireText(transfer.recipient_label, `${period.id}.transfers[${index}].recipient_label`);
      if (!allowedRecipientTypes.has(transfer.recipient_type))
        throw new Error(`${period.id} has an invalid recipient type.`);
      requireCents(transfer.amount_cents, `${period.id}.transfers[${index}].amount_cents`);
      requireIsoDate(transfer.transferred_at, `${period.id}.transfers[${index}].transferred_at`);
      requireText(transfer.evidence_url, `${period.id}.transfers[${index}].evidence_url`);
      if (!transfer.evidence_url.startsWith("https://"))
        throw new Error(`${period.id} transfer evidence must use HTTPS.`);
      return total + transfer.amount_cents;
    }, 0);
    if (transferred !== period.net_profit_cents)
      throw new Error(`${period.id} must transfer 100% of net profit.`);
    if (!Array.isArray(period.deliverables))
      throw new Error(`${period.id}.deliverables must be an array.`);
    for (const [index, deliverable] of period.deliverables.entries()) {
      requireText(deliverable.label, `${period.id}.deliverables[${index}].label`);
      if (!Number.isSafeInteger(deliverable.count) || deliverable.count < 0)
        throw new Error(`${period.id} deliverable count is invalid.`);
      requireText(deliverable.evidence_url, `${period.id}.deliverables[${index}].evidence_url`);
      if (!deliverable.evidence_url.startsWith("https://"))
        throw new Error(`${period.id} deliverable evidence must use HTTPS.`);
    }
  }

  for (const [index, item] of ledger.recognition.entries()) {
    requireText(item.display_name, `recognition[${index}].display_name`);
    if (item.consent !== true) throw new Error(`recognition[${index}] requires explicit consent.`);
    requireIsoDate(item.consented_at, `recognition[${index}].consented_at`);
    requireIsoDate(item.expires_at, `recognition[${index}].expires_at`);
    if (Date.parse(item.expires_at) <= now)
      throw new Error(`recognition[${index}] has expired and must be removed.`);
  }

  const settlements = ledger.model_b_settlements ?? [];
  if (!Array.isArray(settlements)) throw new Error("model_b_settlements must be an array.");
  for (const [index, row] of settlements.entries()) {
    validateModelBSettlement(row, `model_b_settlements[${index}]`);
  }

  return {
    periods: ledger.periods.length,
    recognition: ledger.recognition.length,
    model_b_settlements: settlements.length,
  };
}

/** Validate a settlement-rehearsal.draft.json document. */
export function validateSettlementRehearsalDraft(draft) {
  if (!draft || typeof draft !== "object") throw new Error("rehearsal draft must be an object.");
  inspectKeys(draft);
  if (draft.version !== 1) throw new Error("rehearsal draft version must be 1.");
  if (!Array.isArray(draft.rows)) throw new Error("rehearsal draft rows must be an array.");
  for (const [index, row] of draft.rows.entries()) {
    validateModelBSettlement(row, `rows[${index}]`);
  }
  return { rows: draft.rows.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ledger = JSON.parse(
    await readFile(new URL("../web/data/sponsor-ledger.json", import.meta.url), "utf8"),
  );
  const result = validateSponsorLedger(ledger);
  console.log(
    `Validated ${result.periods} sponsor ledger periods, ${result.recognition} recognition, ${result.model_b_settlements} Model B settlements.`,
  );
  const draft = JSON.parse(
    await readFile(new URL("../web/data/settlement-rehearsal.draft.json", import.meta.url), "utf8"),
  );
  const draftResult = validateSettlementRehearsalDraft(draft);
  console.log(`Validated settlement rehearsal draft: ${draftResult.rows} rows.`);
}
