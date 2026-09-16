import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const allowedRecipientTypes = new Set(["local_charity", "founder_housing_support"]);
const forbiddenKeys = /email|phone|wallet|address|ipAddress|referral|beneficiaryId|userId/i;

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

  return { periods: ledger.periods.length, recognition: ledger.recognition.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ledger = JSON.parse(
    await readFile(new URL("../web/data/sponsor-ledger.json", import.meta.url), "utf8"),
  );
  const result = validateSponsorLedger(ledger);
  console.log(
    `Validated ${result.periods} sponsor ledger periods and ${result.recognition} consented recognition records.`,
  );
}
