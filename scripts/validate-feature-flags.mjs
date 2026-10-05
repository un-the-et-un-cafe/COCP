import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { validateLaunchGates } from "./validate-launch-gates.mjs";

const PAYMENT_FLAGS = [
  "payments_card",
  "payments_sepa",
  "payments_base_mainnet",
  "payments_base_testnet_ui",
  "activity_payments",
];

function fail(message) {
  throw new Error(`Feature flag validation failed: ${message}`);
}

export function validateFeatureFlags(flagsDoc, launchRegister, now = Date.now()) {
  if (!flagsDoc || typeof flagsDoc !== "object") fail("document must be an object.");
  if (flagsDoc.version !== 1) fail("version must be 1.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(flagsDoc.updated_at ?? "")) fail("updated_at must be an ISO date.");
  if (!flagsDoc.flags || typeof flagsDoc.flags !== "object") fail("flags must be an object.");

  const required = [
    "payments_card",
    "payments_sepa",
    "payments_base_mainnet",
    "payments_base_testnet_ui",
    "sponsor_evidence_pack",
    "print_qr_generator",
    "listing_qa_dashboard",
    "voucher_pilot",
    "activity_intake",
    "activity_payments",
  ];
  for (const key of required) {
    if (typeof flagsDoc.flags[key] !== "boolean") fail(`${key} must be a boolean.`);
  }

  const gateResult = validateLaunchGates(launchRegister, now);
  const gatesComplete = gateResult.passed === gateResult.total;
  const anyPaymentTrue = PAYMENT_FLAGS.some((key) => flagsDoc.flags[key] === true);

  if (anyPaymentTrue && !gatesComplete) {
    fail("payments_* / activity_payments cannot be true while launch gates are incomplete.");
  }

  if (flagsDoc.flags.payments_base_mainnet === true) {
    fail("payments_base_mainnet must stay false in this slice (no mainnet).");
  }

  // payment_lanes in launch-gates must remain false if flags payments are false
  const lanes = launchRegister.payment_lanes;
  if (lanes.card || lanes.sepa || lanes.base) {
    if (!gatesComplete) fail("launch-gates payment_lanes cannot open while gates are blocked.");
  }

  // Model B: card/sepa are TradFi checkout lanes; base lane is settlement payout, not sponsor checkout.
  // Keep all false until human gates pass.
  if (
    flagsDoc.flags.payments_card === false &&
    flagsDoc.flags.payments_sepa === false &&
    flagsDoc.flags.payments_base_mainnet === false &&
    (lanes.card || lanes.sepa || lanes.base)
  ) {
    fail("payment_lanes disagree with feature-flags (lanes open while payment flags false).");
  }

  return {
    paymentFlagsOpen: anyPaymentTrue,
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
    `Validated feature flags; payment flags open=${result.paymentFlagsOpen}; gates complete=${result.gatesComplete}.`,
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
