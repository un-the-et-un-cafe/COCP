import test from "node:test";
import assert from "node:assert/strict";
import { SYNTHETIC_RECEIPT, renderEvidenceHtml } from "../scripts/generate-sponsor-evidence.mjs";

test("evidence pack includes Model B fiat ref and settlement proof", () => {
  const html = renderEvidenceHtml(SYNTHETIC_RECEIPT, "en");
  assert.match(html, /SYN-CARD-20261005-0001/);
  assert.match(html, /settlement_tx_hash|0xsandboxdeadbeef/i);
  assert.match(html, /90% charity/i);
  assert.match(html, /card or SEPA/i);
  assert.doesNotMatch(html, /we track users|connect wallet to sponsor|pay with crypto to sponsor/i);
  assert.match(html, /No tax-deduction claim/);
  assert.doesNotMatch(html, /\brefugees?\b|tax-deductible|eligible for tax|<img/i);
  assert.equal(SYNTHETIC_RECEIPT.synthetic, true);
  assert.equal(SYNTHETIC_RECEIPT.lane, "tradfi_then_base_usdc");
});

test("AR evidence template is RTL, carries the same proof fields and stays flagged pending_human_review", () => {
  const html = renderEvidenceHtml(SYNTHETIC_RECEIPT, "ar");
  assert.match(html, /<html lang="ar" dir="rtl">/);
  assert.match(html, /data-pending-human-review="true"/);
  assert.match(html, /pending_human_review/);
  assert.match(html, /SYN-CARD-20261005-0001/);
  assert.match(html, /0xsandboxdeadbeef/);
  assert.match(html, /SEPA/);
  assert.match(html, /لا يُدَّعى أي خصم ضريبي/);
  assert.doesNotMatch(html, /لاجئ|<img|<script/i);
  assert.equal(SYNTHETIC_RECEIPT.disclaimers.ar_status, "pending_human_review");
  assert.deepEqual(SYNTHETIC_RECEIPT.pending_human_review, { fr: false, en: false, ar: true });
});

test("FR/EN evidence packs do not depend on the AR draft", () => {
  for (const locale of ["fr", "en"]) {
    const html = renderEvidenceHtml(SYNTHETIC_RECEIPT, locale);
    assert.doesNotMatch(html, /pending_human_review|dir="rtl"/);
  }
});
