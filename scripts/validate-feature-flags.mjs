import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { validateLaunchGates } from "./validate-launch-gates.mjs";

/** Production payment flags — cannot be true while gates blocked. */
const PRODUCTION_PAYMENT_FLAGS = [
  "payments_card",
  "payments_sepa",
  "payments_base_mainnet",
  "activity_payments",
];

/** Sandbox-only UI flags — may be true without opening production lanes, but still fail-closed for live keys. */
const SANDBOX_UI_FLAGS = [
  "payments_base_testnet_ui",
  "payments_card_testmode_ui",
  "payments_sepa_testmode_ui",
  "payout_queue_sandbox",
  "association_wallet_registry_ui",
  "reconciliation_report_sandbox",
];

const REQUIRED_FLAGS = [
  "payments_card",
  "payments_sepa",
  "payments_base_mainnet",
  "payments_base_testnet_ui",
  "payments_card_testmode_ui",
  "payments_sepa_testmode_ui",
  "payout_queue_sandbox",
  "association_wallet_registry_ui",
  "reconciliation_report_sandbox",
  "day_rhythm_categories",
  "sponsor_evidence_pack",
  "print_qr_generator",
  "listing_qa_dashboard",
  "voucher_pilot",
  "activity_intake",
  "activity_payments",
];

function fail(message) {
  throw new Error(`Feature flag validation failed: ${message}`);
}

export function validateFeatureFlags(flagsDoc, launchRegister, now = Date.now(), env = process.env) {
  if (!flagsDoc || typeof flagsDoc !== "object") fail("document must be an object.");
  if (flagsDoc.version !== 2) fail("version must be 2.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(flagsDoc.updated_at ?? "")) fail("updated_at must be an ISO date.");
  if (!flagsDoc.flags || typeof flagsDoc.flags !== "object") fail("flags must be an object.");

  for (const key of REQUIRED_FLAGS) {
    if (typeof flagsDoc.flags[key] !== "boolean") fail(`${key} must be a boolean.`);
  }

  const gateResult = validateLaunchGates(launchRegister, now);
  const gatesComplete = gateResult.passed === gateResult.total;
  const anyProductionPaymentTrue = PRODUCTION_PAYMENT_FLAGS.some((key) => flagsDoc.flags[key] === true);
  // Treat payments_base_testnet_ui as payment-gated for production gates (v0.1 behaviour retained).
  const anyGatedPaymentTrue =
    anyProductionPaymentTrue || flagsDoc.flags.payments_base_testnet_ui === true;

  if (anyGatedPaymentTrue && !gatesComplete) {
    fail("payments_* / activity_payments cannot be true while launch gates are incomplete.");
  }

  if (flagsDoc.flags.payments_base_mainnet === true) {
    fail("payments_base_mainnet must stay false in this slice (no mainnet).");
  }

  const lanes = launchRegister.payment_lanes;
  if ((lanes.card || lanes.sepa || lanes.base) && !gatesComplete) {
    fail("launch-gates payment_lanes cannot open while gates are blocked.");
  }

  if (
    flagsDoc.flags.payments_card === false &&
    flagsDoc.flags.payments_sepa === false &&
    flagsDoc.flags.payments_base_mainnet === false &&
    (lanes.card || lanes.sepa || lanes.base)
  ) {
    fail("payment_lanes disagree with feature-flags (lanes open while payment flags false).");
  }

  const testmodeOn =
    flagsDoc.flags.payments_card_testmode_ui === true ||
    flagsDoc.flags.payments_sepa_testmode_ui === true;
  if (testmodeOn) {
    const pk = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLISHABLE_KEY || "";
    const sk = env.STRIPE_SECRET_KEY || "";
    if (pk.startsWith("pk_live_") || sk.startsWith("sk_live_")) {
      fail("live Stripe keys are forbidden when testmode UI flags are true.");
    }
    // If keys are present they must be test-mode prefixes
    if (pk && !pk.startsWith("pk_test_")) fail("Stripe publishable key must be pk_test_ when testmode UI is on.");
    if (sk && !sk.startsWith("sk_test_")) fail("Stripe secret key must be sk_test_ when testmode UI is on.");
  }

  return {
    paymentFlagsOpen: anyGatedPaymentTrue,
    sandboxUiOpen: SANDBOX_UI_FLAGS.some((k) => flagsDoc.flags[k] === true),
    gatesComplete,
    flags: { ...flagsDoc.flags },
  };
}

async function main() {
  const flagsDoc = JSON.parse(
    await readFile(new URL("../web/data/feature-flags.json", import.meta.url), "utf8"),
  );
  const launchRegister = JSON.parse(
    await readFile(new URL("../web/data/launch-gates.json", import.meta.url), "utf8"),
  );
  const result = validateFeatureFlags(flagsDoc, launchRegister);
  console.log(
    `Validated feature flags v2; payment flags open=${result.paymentFlagsOpen}; sandbox UI open=${result.sandboxUiOpen}; gates complete=${result.gatesComplete}.`,
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
