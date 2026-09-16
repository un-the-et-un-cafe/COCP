import test from "node:test";
import assert from "node:assert/strict";
import { auditHtml, budgets } from "../web/scripts/audit-static-site.mjs";

const validHtml = `<!doctype html>
<html lang="fr"><head><meta name="viewport" content="width=device-width"><title>Test</title>
<link rel="stylesheet" href="/_next/static/app.css"></head>
<body><h1>Directory</h1><a href="https://example.org" target="_blank" rel="noreferrer">External</a>
<script type="module" src="/_next/static/app.js"></script></body></html>`;

test("static audit accepts self-hosted executable assets and protected external links", () => {
  assert.doesNotThrow(() => auditHtml(validHtml, "/"));
});

test("static audit rejects third-party scripts and embedded content", () => {
  assert.throws(
    () =>
      auditHtml(validHtml.replace("/_next/static/app.js", "https://tracker.example/app.js"), "/"),
    /external executable script/,
  );
  assert.throws(
    () =>
      auditHtml(validHtml.replace("<h1>", '<iframe src="https://example.org"></iframe><h1>'), "/"),
    /embedded third-party content/,
  );
});

test("static audit rejects unsafe new-tab links and missing mobile metadata", () => {
  assert.throws(
    () => auditHtml(validHtml.replace(' rel="noreferrer"', ""), "/"),
    /must suppress referrer details/,
  );
  assert.throws(
    () => auditHtml(validHtml.replace(/<meta name="viewport"[^>]*>/, ""), "/"),
    /mobile viewport/,
  );
});

test("static performance budgets remain explicit and bounded", () => {
  assert.equal(budgets.totalBytes, 1_500_000);
  assert.equal(budgets.totalJavaScriptBytes, 750_000);
  assert.equal(budgets.largestJavaScriptBytes, 250_000);
  assert.equal(budgets.totalCssBytes, 225_000);
  assert.equal(budgets.routeHtmlBytes, 80_000);
});
