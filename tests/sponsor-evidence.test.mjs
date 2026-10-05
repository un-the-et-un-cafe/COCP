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
