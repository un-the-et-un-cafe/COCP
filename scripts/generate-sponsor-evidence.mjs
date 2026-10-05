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
    ar: "مثال اصطناعي. لا يُدَّعى أي خصم ضريبي. لا توجد قصة شخصية لأي مستفيد. لا توجد صور لأشخاص في المنفى.",
    ar_status: "pending_human_review",
  },
  pending_human_review: { fr: false, en: false, ar: true },
};

// AR copy is a first-pass draft (not reviewed by a human translator). Per Spec-Build WP-E it
// stays flagged pending_human_review and carries a visible banner until G4 language review.
const AR = {
  title: "حزمة إثبات الراعي (بيانات اصطناعية — النموذج ب)",
  review:
    "مسودة ترجمة أولية — بانتظار مراجعة بشرية (pending_human_review). لا تُستخدم خارج البيئة التجريبية قبل المراجعة.",
  warn: "بيئة تجريبية / بيانات اصطناعية — المدفوعات غير مفعّلة. في التشغيل الفعلي يدفع الرعاة بالبطاقة المصرفية أو بتحويل SEPA؛ تُستخدم العملات المشفّرة لمرحلة التسوية فقط.",
  labels: {
    receipt: "إيصال الدفع المصرفي",
    eur: "المبلغ باليورو",
    pkg: "الباقة / الحملة",
    alloc: "التوزيع",
    usdc: "تسوية USDC",
    proof: "الإثبات على السلسلة",
    proofUrl: "رابط الإثبات",
    recon: "المطابقة",
    expires: "انتهاء الإشادة بالراعي",
    lane: "المسار",
  },
};

const ltr = (v) => `<span dir="ltr">${v}</span>`;

function renderArabicEvidenceHtml(receipt) {
  const L = AR.labels;
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${AR.title}</title>
  <meta name="robots" content="noindex,nofollow" />
  <style>
    body { font-family: system-ui, "Noto Naskh Arabic", sans-serif; max-width: 720px; margin: 2rem auto; color: #111; }
    h1 { font-size: 1.4rem; }
    dl { display: grid; grid-template-columns: 12rem 1fr; gap: 0.4rem 1rem; }
    dt { font-weight: 600; }
    .warn { border: 1px solid #a60; background: #fff8e8; padding: 0.75rem 1rem; }
    .review { border: 2px solid #b00; color: #b00; font-weight: 700; padding: 0.5rem 1rem; }
    .disclaimer { margin-top: 1.5rem; font-size: 0.9rem; color: #333; }
  </style>
</head>
<body data-pending-human-review="true">
  <p class="review">${AR.review}</p>
  <p class="warn">${AR.warn}</p>
  <h1>${AR.title}</h1>
  <dl>
    <dt>${L.receipt}</dt><dd>${ltr(receipt.fiat_payment_ref)}</dd>
    <dt>${L.eur}</dt><dd>${ltr(`${(receipt.eur_amount_cents / 100).toFixed(2)} EUR`)}</dd>
    <dt>${L.pkg}</dt><dd>${ltr(`${receipt.package_id} / ${receipt.campaign_id}`)}</dd>
    <dt>${L.alloc}</dt><dd>90% للعمل الخيري / 10% للإدارة (${ltr(`${receipt.charity_eur_cents / 100} / ${receipt.admin_eur_cents / 100} EUR`)})</dd>
    <dt>${L.usdc}</dt><dd>${ltr(`${(receipt.usdc_amount_micro / 1_000_000).toFixed(2)} USDC`)} على شبكة ${ltr(receipt.settlement_network)}</dd>
    <dt>${L.proof}</dt><dd><code dir="ltr">${receipt.settlement_tx_hash}</code></dd>
    <dt>${L.proofUrl}</dt><dd><a dir="ltr" href="${receipt.proof_url}">${receipt.proof_url}</a></dd>
    <dt>${L.recon}</dt><dd>${ltr(receipt.reconciliation_status)}</dd>
    <dt>${L.expires}</dt><dd>${ltr(receipt.recognition_expires_at)}</dd>
    <dt>${L.lane}</dt><dd>${ltr(receipt.lane)}</dd>
  </dl>
  <p class="disclaimer">${receipt.disclaimers.ar}</p>
</body>
</html>
`;
}

export function renderEvidenceHtml(receipt = SYNTHETIC_RECEIPT, locale = "fr") {
  if (locale === "ar") return renderArabicEvidenceHtml(receipt);
  const d = receipt.disclaimers;
  const disclaimer = locale === "en" ? d.en : d.fr;
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
  const outDir = resolve(root, "web/public/evidence");
  await mkdir(outDir, { recursive: true });
  const fr = renderEvidenceHtml(SYNTHETIC_RECEIPT, "fr");
  const en = renderEvidenceHtml(SYNTHETIC_RECEIPT, "en");
  await writeFile(resolve(outDir, "evidence-pack.synthetic.fr.html"), fr);
  await writeFile(resolve(outDir, "evidence-pack.synthetic.en.html"), en);
  await writeFile(resolve(outDir, "evidence-pack.synthetic.ar.html"), renderEvidenceHtml(SYNTHETIC_RECEIPT, "ar"));
  await writeFile(
    resolve(root, "web/data/sponsor-evidence.synthetic.json"),
    `${JSON.stringify(SYNTHETIC_RECEIPT, null, 2)}\n`,
  );
  console.log("Wrote synthetic sponsor evidence pack (FR+EN HTML, AR draft pending_human_review, JSON).");
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
