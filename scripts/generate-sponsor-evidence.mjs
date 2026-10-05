import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const SYNTHETIC_RECEIPT = {
  version: 1,
  synthetic: true,
  package_id: "founding-sponsor-79",
  campaign_id: "sandbox-verification-2026-10",
  lane: "tradfi_then_base_usdc",
  fiat_payment_ref: "SYN-CARD-20261005-0001",
  eur_amount_cents: 7900,
  split: { charity_bps: 9000, admin_bps: 1000 },
  charity_eur_cents: 7110,
  admin_eur_cents: 790,
  usdc_amount_micro: 71_100_000, // 71.10 USDC (1:1 sandbox stub)
  settlement_tx_hash: "0xsandboxdeadbeef000000000000000000000000000000000000000000000001",
  settlement_network: "base-sepolia",
  reconciliation_status: "sandbox_matched",
  recognition_expires_at: "2027-01-05",
  proof_url: "https://example.org/sponsors/sandbox#synthetic-proof",
  disclaimers: {
    fr: "Exemple synthétique. Aucune déduction fiscale n’est revendiquée. Aucune histoire personnelle de bénéficiaire. Aucune image de personnes en exil.",
    en: "Synthetic example. No tax-deduction claim. No beneficiary personal story. No imagery of people in exile.",
    ar_status: "pending_review",
  },
};

export function renderEvidenceHtml(receipt = SYNTHETIC_RECEIPT, locale = "fr") {
  const d = receipt.disclaimers;
  const disclaimer =
    locale === "en" ? d.en : locale === "fr" ? d.fr : `${d.en} (AR: ${d.ar_status})`;
  const title =
    locale === "en"
      ? "Sponsor evidence pack (synthetic — Model B)"
      : "Pack de preuves sponsor (synthétique — modèle B)";
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta name="robots" content="noindex,nofollow" />
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; color: #111; }
    h1 { font-size: 1.4rem; }
    dl { display: grid; grid-template-columns: 12rem 1fr; gap: 0.4rem 1rem; }
    dt { font-weight: 600; }
    .warn { border: 1px solid #a60; background: #fff8e8; padding: 0.75rem 1rem; }
    .disclaimer { margin-top: 1.5rem; font-size: 0.9rem; color: #333; }
  </style>
</head>
<body>
  <p class="warn">SANDBOX / SYNTHETIC DATA — payments are not live. Production sponsors pay by card or SEPA; crypto is the settlement leg only.</p>
  <h1>${title}</h1>
  <dl>
    <dt>TradFi receipt</dt><dd>${receipt.fiat_payment_ref}</dd>
    <dt>EUR amount</dt><dd>${(receipt.eur_amount_cents / 100).toFixed(2)} EUR</dd>
    <dt>Package / campaign</dt><dd>${receipt.package_id} / ${receipt.campaign_id}</dd>
    <dt>Allocation</dt><dd>90% charity / 10% admin (${receipt.charity_eur_cents / 100} / ${receipt.admin_eur_cents / 100} EUR)</dd>
    <dt>USDC settlement</dt><dd>${(receipt.usdc_amount_micro / 1_000_000).toFixed(2)} USDC on ${receipt.settlement_network}</dd>
    <dt>On-chain proof</dt><dd><code>${receipt.settlement_tx_hash}</code></dd>
    <dt>Proof URL</dt><dd><a href="${receipt.proof_url}">${receipt.proof_url}</a></dd>
    <dt>Reconciliation</dt><dd>${receipt.reconciliation_status}</dd>
    <dt>Recognition expires</dt><dd>${receipt.recognition_expires_at}</dd>
    <dt>Lane</dt><dd>${receipt.lane}</dd>
  </dl>
  <p class="disclaimer">${disclaimer}</p>
</body>
</html>
`;
}

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const outDir = resolve(root, "web/public/sponsors");
  await mkdir(outDir, { recursive: true });
  const fr = renderEvidenceHtml(SYNTHETIC_RECEIPT, "fr");
  const en = renderEvidenceHtml(SYNTHETIC_RECEIPT, "en");
  await writeFile(resolve(outDir, "evidence-pack.synthetic.fr.html"), fr);
  await writeFile(resolve(outDir, "evidence-pack.synthetic.en.html"), en);
  await writeFile(
    resolve(root, "web/data/sponsor-evidence.synthetic.json"),
    `${JSON.stringify(SYNTHETIC_RECEIPT, null, 2)}\n`,
  );
  console.log("Wrote synthetic sponsor evidence pack (FR+EN HTML + JSON).");
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
