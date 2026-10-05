import test from "node:test";
import assert from "node:assert/strict";
import { buildPrintCard } from "../scripts/generate-qr-pack.mjs";

test("print QR pack points at https origin with emergency deep link and no analytics", () => {
  const card = buildPrintCard({ origin: "https://cocp.example.org", deepLink: "/#emergency" });
  assert.equal(card.url, "https://cocp.example.org/#emergency");
  assert.match(card.html, /Calais services — FR \/ EN \/ AR/);
  assert.match(card.html, /confirm place and time before travelling/i);
  assert.match(card.html, /COCP/);
  assert.doesNotMatch(card.html, /google-analytics|gtag|plausible|segment|mixpanel|facebook/i);
  assert.doesNotMatch(card.html, /<img|<script/i);
});
