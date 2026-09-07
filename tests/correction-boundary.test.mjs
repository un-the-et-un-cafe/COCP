import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const api = await readFile(new URL('../web/app/api/corrections/route.ts', import.meta.url), 'utf8');
const database = await readFile(new URL('../web/db/schema.ts', import.meta.url), 'utf8');
const form = await readFile(new URL('../web/app/corrections/page.tsx', import.meta.url), 'utf8');
const purge = await readFile(new URL('../web/scripts/purge-resolved-corrections.sql', import.meta.url), 'utf8');

test('anonymous correction route has no public read operation or identity fields', () => {
  assert.doesNotMatch(api, /export\s+async\s+function\s+GET/);
  assert.doesNotMatch(database, /email|phone|ip_address|immigration|nationality|case_history/i);
});

test('correction input is bounded and requires an explicit privacy confirmation', () => {
  assert.match(form, /maxLength=\{800\}/);
  assert.match(form, /privacyConfirmed/);
  assert.match(api, /application\/json/);
  assert.match(api, /content-length/);
});

test('moderation records support resolution and scheduled deletion', () => {
  assert.match(database, /resolvedAt/);
  assert.match(database, /deleteAfter/);
  assert.match(purge, /DELETE FROM correction_reports/);
  assert.match(purge, /delete_after <=/);
});

test('correction WebMCP tool is explicit about its write and untrusted content', () => {
  assert.match(form, /name: 'submit_service_correction'/);
  assert.match(form, /readOnlyHint: false/);
  assert.match(form, /untrustedContentHint: true/);
});
