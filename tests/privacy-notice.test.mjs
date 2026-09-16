import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const home = await readFile(new URL("../web/app/page.tsx", import.meta.url), "utf8");
const notice = await readFile(new URL("../web/app/privacy/page.tsx", import.meta.url), "utf8");
const locale = await readFile(new URL("../web/app/use-locale.ts", import.meta.url), "utf8");
const corrections = await readFile(
  new URL("../web/convex/corrections.ts", import.meta.url),
  "utf8",
);
const crons = await readFile(new URL("../web/convex/crons.ts", import.meta.url), "utf8");
const schema = await readFile(new URL("../web/convex/schema.ts", import.meta.url), "utf8");
const intake = await readFile(
  new URL("../web/netlify/functions/corrections.mts", import.meta.url),
  "utf8",
);
const netlifyPreparation = await readFile(
  new URL("../web/scripts/prepare-netlify.mjs", import.meta.url),
  "utf8",
);

test("privacy notice is discoverable and exported as a Netlify route", () => {
  assert.match(home, /href="\/privacy"/);
  assert.match(netlifyPreparation, /'privacy\.html', 'privacy\/index\.html'/);
});

test("privacy notice matches implemented language and correction retention", () => {
  assert.match(locale, /localStorage\.setItem\('cocp-locale'/);
  assert.match(notice, /local storage under the cocp-locale key/);
  assert.match(corrections, /const retentionMs = 30 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(corrections, /internal\.corrections\.purgeExpired/);
  assert.match(crons, /crons\.daily/);
  assert.match(notice, /no more than 30 days/);
});

test("network rate limiting is disclosed without claiming IP storage", () => {
  assert.match(intake, /aggregateBy: \['ip', 'domain'\]/);
  assert.match(notice, /rate-limits correction intake using IP address and domain/);
  const correctionTable = schema.slice(schema.indexOf("correctionReports:"));
  assert.doesNotMatch(correctionTable, /ipAddress|userAgent|email|phone/);
  assert.match(notice, /does not store this network data in its database/);
});

test("privacy notice keeps payments and personal profiling disabled", () => {
  assert.match(notice, /Payments are disabled/);
  assert.match(notice, /no advertising, behavioural analytics, wallet or payment collection/);
  assert.match(notice, /never use it for a request containing personal data/);
});
