import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { rehearseModelBSettlement } from "./rehearse-settlement-payout.mjs";

const LABELS = {
  fr: {
    title: "Pack de preuves sponsor (synthétique — modèle B)",
    warn: "BAC À SABLE / DONNÉES SYNTHÉTIQUES — les paiements ne sont pas actifs. En production, les sponsors paient par carte ou SEPA ; la crypto n’est que la jambe de règlement.",
    receipt: "Reçu TradFi",
    eur: "Montant EUR",
    pkg: "Offre / campagne",
    alloc: "Répartition",
    usdc: "Règlement USDC",
    proof: "Preuve on-chain",
    proofUrl: "URL de preuve",
    recon: "Rapprochement",
    expires: "Fin de la reconnaissance",
    lane: "Voie",
  },
  en: {
    title: "Sponsor evidence pack (synthetic — Model B)",
    warn: "SANDBOX / SYNTHETIC DATA — payments are not live. Production sponsors pay by card or SEPA; crypto is the settlement leg only.",
    receipt: "TradFi receipt",
    eur: "EUR amount",
    pkg: "Package / campaign",
    alloc: "Allocation",
    usdc: "USDC settlement",
    proof: "On-chain proof",
    proofUrl: "Proof URL",
    recon: "Reconciliation",
    expires: "Recognition expires",
    lane: "Lane",
  },
};

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

/** Build synthetic receipt from the canonical rehearsal row (keeps tx hashes consistent). */
export function buildSyntheticReceiptFromRehearsal(row) {
  return {
    version: 1,
    synthetic: true,
    package_id: row.package_id,
    campaign_id: row.campaign_id,
    lane: row.lane,
    fiat_payment_ref: row.fiat_payment_ref,
    eur_amount_cents: row.eur_amount_cents,
    split: { charity_bps: row.split_90_10.charity_bps, admin_bps: row.split_90_10.admin_bps },
    charity_eur_cents: row.split_90_10.charity_eur_cents,
    admin_eur_cents: row.split_90_10.admin_eur_cents,
    usdc_amount_micro: row.usdc_amount_micro,
    settlement_tx_hash: row.settlement_tx_hash,
    settlement_network: row.settlement_network,
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
}

export const SYNTHETIC_RECEIPT = buildSyntheticReceiptFromRehearsal(
  rehearseModelBSettlement({
    eur_amount_cents: 7900,
    package_id: "founding-sponsor-79",
    campaign_id: "sandbox-verification-2026-10",
    fiat_payment_ref: "SYN-CARD-20261005-0001",
    refund_window_closed: true,
  }),
);

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
  const L = LABELS[locale] ?? LABELS.fr;
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <title>${L.title}</title>
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
  <p class="warn">${L.warn}</p>
  <h1>${L.title}</h1>
  <dl>
    <dt>${L.receipt}</dt><dd>${receipt.fiat_payment_ref}</dd>
    <dt>${L.eur}</dt><dd>${(receipt.eur_amount_cents / 100).toFixed(2)} EUR</dd>
    <dt>${L.pkg}</dt><dd>${receipt.package_id} / ${receipt.campaign_id}</dd>
    <dt>${L.alloc}</dt><dd>90% charity / 10% admin (${receipt.charity_eur_cents / 100} / ${receipt.admin_eur_cents / 100} EUR)</dd>
    <dt>${L.usdc}</dt><dd>${(receipt.usdc_amount_micro / 1_000_000).toFixed(2)} USDC on ${receipt.settlement_network}</dd>
    <dt>${L.proof}</dt><dd><code>${receipt.settlement_tx_hash}</code></dd>
    <dt>${L.proofUrl}</dt><dd><a href="${receipt.proof_url}">${receipt.proof_url}</a></dd>
    <dt>${L.recon}</dt><dd>${receipt.reconciliation_status}</dd>
    <dt>${L.expires}</dt><dd>${receipt.recognition_expires_at}</dd>
    <dt>${L.lane}</dt><dd>${receipt.lane}</dd>
  </dl>
  <p class="disclaimer">${disclaimer}</p>
</body>
</html>
`;
}

async function main() {
  const root = resolve(import.meta.dirname, "..");
  // Prefer committed rehearsal row so evidence tx hash matches draft (L-1).
  let receipt = SYNTHETIC_RECEIPT;
  try {
    const draft = JSON.parse(
      await readFile(resolve(root, "web/data/settlement-rehearsal.draft.json"), "utf8"),
    );
    const row = (draft.rows ?? []).find((r) => r.fiat_payment_ref === "SYN-CARD-20261005-0001");
    if (row) receipt = buildSyntheticReceiptFromRehearsal(row);
  } catch {
    /* use SYNTHETIC_RECEIPT */
  }

  const outDir = resolve(root, "web/public/evidence");
  await mkdir(outDir, { recursive: true });
  await writeFile(resolve(outDir, "evidence-pack.synthetic.fr.html"), renderEvidenceHtml(receipt, "fr"));
  await writeFile(resolve(outDir, "evidence-pack.synthetic.en.html"), renderEvidenceHtml(receipt, "en"));
  await writeFile(resolve(outDir, "evidence-pack.synthetic.ar.html"), renderEvidenceHtml(receipt, "ar"));
  await writeFile(
    resolve(root, "web/data/sponsor-evidence.synthetic.json"),
    `${JSON.stringify(receipt, null, 2)}\n`,
  );
  console.log("Wrote synthetic sponsor evidence pack (FR labels localised, EN, AR pending_human_review, JSON).");
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
