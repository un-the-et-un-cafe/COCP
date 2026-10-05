/**
 * Stripe test-mode webhook handler stub (no network, no live keys).
 * Verifies synthetic signature; rejects live-mode events; writes ledger draft
 * rows without PII.
 */
import { createPaidSponsorship, enterHolding } from "./refund-window-state.mjs";
import { readFile } from "node:fs/promises";

export function assertTestModeEvent(event) {
  if (!event || typeof event !== "object") throw new Error("event required");
  if (event.livemode === true) throw new Error("live-mode Stripe events are rejected");
  if (event.livemode !== false) throw new Error("event.livemode must be false for test mode");
  return true;
}

export function verifyStripeSignature({ payload, signature, secret }) {
  // Sandbox: accept only exact "t=1,v1=sandbox_ok" with secret starting sk_test_ or whsec_test_
  if (!secret || (!secret.startsWith("sk_test_") && !secret.startsWith("whsec_test_"))) {
    throw new Error("webhook secret must be test-mode");
  }
  if (signature !== "t=1,v1=sandbox_ok") throw new Error("invalid Stripe signature");
  if (!payload) throw new Error("payload required");
  return true;
}

export async function loadPackageCents(packageId, packagesPath) {
  const doc = JSON.parse(await readFile(packagesPath, "utf8"));
  const pkg = doc.packages.find((p) => p.package_id === packageId);
  if (!pkg) throw new Error(`unknown package_id ${packageId}`);
  return pkg.eur_cents;
}

/**
 * Map a Stripe checkout.session.completed (test) into a public ledger draft row.
 * Strips email / billing / payment_method_details fingerprints.
 */
export function eventToLedgerDraft(event, { package_id, campaign_id, eur_amount_cents, payment_method, paid_at }) {
  assertTestModeEvent(event);
  const fiat_payment_ref =
    event.data?.object?.payment_intent ||
    event.data?.object?.id ||
    event.id;
  if (!fiat_payment_ref) throw new Error("missing payment ref on event");
  let row = createPaidSponsorship({
    fiat_payment_ref: String(fiat_payment_ref),
    package_id,
    campaign_id,
    eur_amount_cents,
    payment_method,
    paid_at: paid_at ?? event.created_iso ?? new Date().toISOString(),
  });
  row = enterHolding(row, row.paid_at);
  // Ensure no PII keys leaked from event
  const json = JSON.stringify(row);
  if (/email|billing_details|fingerprint|customer_name/i.test(json)) {
    throw new Error("PII leaked into ledger draft");
  }
  return row;
}
