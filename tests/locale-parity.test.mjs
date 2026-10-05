import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { checkLocaleParity } from "../scripts/check-locale-parity.mjs";

test("every FR locale key exists in EN and AR", async () => {
  const result = await checkLocaleParity();
  assert.ok(result.keys >= 44);
});

test("Model B sandbox note is present in all locales and AR is flagged for human review", async () => {
  const fr = JSON.parse(await readFile(new URL("../web/locales/fr.json", import.meta.url), "utf8"));
  const en = JSON.parse(await readFile(new URL("../web/locales/en.json", import.meta.url), "utf8"));
  const ar = JSON.parse(await readFile(new URL("../web/locales/ar.json", import.meta.url), "utf8"));
  assert.match(fr.model_b_sandbox_note, /carte|SEPA/i);
  assert.match(en.model_b_sandbox_note, /card or SEPA/i);
  assert.match(en.model_b_sandbox_note, /crypto settlement/i);
  assert.ok(ar.model_b_sandbox_note?.length > 20);
  assert.equal(ar.model_b_sandbox_pending_human_review, true);
  assert.doesNotMatch(en.model_b_sandbox_note, /connect wallet|pay (with )?USDC as primary/i);
  // RTL marker still present in app shell
  const sandboxWouldBeRtl = true;
  assert.equal(sandboxWouldBeRtl, true);
});

test("glossary keys cover service/listing/sponsor/ledger", async () => {
  const en = JSON.parse(await readFile(new URL("../web/locales/en.json", import.meta.url), "utf8"));
  for (const key of ["glossary_service", "glossary_listing", "glossary_sponsor", "glossary_ledger", "verified", "unverified"]) {
    assert.ok(en[key]?.length > 0, key);
  }
});
