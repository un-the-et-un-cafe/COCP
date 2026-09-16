import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const api = await readFile(new URL('../web/app/api/corrections/route.ts', import.meta.url), 'utf8');
const netlifyApi = await readFile(new URL('../web/netlify/functions/corrections.mts', import.meta.url), 'utf8');
const schema = await readFile(new URL('../web/convex/schema.ts', import.meta.url), 'utf8');
const corrections = await readFile(new URL('../web/convex/corrections.ts', import.meta.url), 'utf8');
const crons = await readFile(new URL('../web/convex/crons.ts', import.meta.url), 'utf8');
const http = await readFile(new URL('../web/convex/http.ts', import.meta.url), 'utf8');
const form = await readFile(new URL('../web/app/corrections/page.tsx', import.meta.url), 'utf8');
const netlifyConfig = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');
const moderationScript = await readFile(new URL('../scripts/moderate-corrections.mjs', import.meta.url), 'utf8');
const rootManifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('anonymous correction route has no public read operation or identity fields', () => {
  assert.doesNotMatch(api, /export\s+async\s+function\s+GET/);
  assert.match(netlifyApi, /request\.method !== 'POST'/);
  assert.doesNotMatch(http, /path:\s*'\/corrections'[\s\S]{0,80}method:\s*'GET'/);
  assert.doesNotMatch(corrections, /export const \w+ = (?:query|mutation)\(/);
  assert.match(corrections, /internalQuery/);
  assert.match(corrections, /internalMutation/);
  assert.doesNotMatch(schema, /email|phone|ipAddress|immigration|nationality|caseHistory/i);
  assert.match(api, /data\/listings\.json/);
  assert.match(netlifyApi, /data\/listings\.json/);
  assert.match(form, /data\/listings\.json/);
});

test('correction input is bounded and requires an explicit privacy confirmation', () => {
  assert.match(form, /maxLength=\{800\}/);
  assert.match(form, /privacyConfirmed/);
  assert.match(api, /application\/json/);
  assert.match(api, /byteLength > 4096/);
  assert.match(netlifyApi, /application\/json/);
  assert.match(netlifyApi, /byteLength > 4096/);
  assert.match(netlifyApi, /rateLimit/);
  assert.match(netlifyApi, /aggregateBy: \['ip', 'domain'\]/);
});

test('moderation records support resolution and scheduled deletion', () => {
  assert.match(schema, /resolvedAt/);
  assert.match(schema, /by_expiresAt/);
  assert.match(corrections, /export const listPending = internalQuery/);
  assert.match(corrections, /export const moderate = internalMutation/);
  assert.match(corrections, /v\.id\('correctionReports'\)/);
  assert.match(corrections, /report\.status !== 'pending'/);
  assert.match(corrections, /ctx\.db\.patch\(reportId, \{ status: outcome, resolvedAt \}\)/);
  assert.match(corrections, /retentionMs = 30 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(corrections, /ctx\.db\.delete\(report\._id\)/);
  assert.match(crons, /crons\.daily/);
  assert.match(http, /CORRECTION_API_TOKEN/);
});

test('operator moderation is private, deliberate, and production-guarded', () => {
  assert.equal(rootManifest.scripts['corrections:review'], 'node scripts/moderate-corrections.mjs');
  assert.match(moderationScript, /corrections:listPending/);
  assert.match(moderationScript, /corrections:moderate/);
  assert.match(moderationScript, /--show-messages/);
  assert.match(moderationScript, /\[hidden; \$\{report\.message\.length\} characters\]/);
  assert.match(moderationScript, /--confirm-reviewed/);
  assert.match(moderationScript, /--prod --confirm-production/);
  assert.match(moderationScript, /reports\.some\(\(report\) => report\._id === reportId\)/);
  assert.doesNotMatch(moderationScript, /shell:\s*true/);
});

test('correction WebMCP tool is explicit about its write and untrusted content', () => {
  assert.match(form, /name: 'submit_service_correction'/);
  assert.match(form, /readOnlyHint: false/);
  assert.match(form, /untrustedContentHint: true/);
});

test('Netlify deploys Convex only in production and keeps credentials out of source', () => {
  assert.match(netlifyConfig, /\[context\.production\][\s\S]*command = "npm run deploy:netlify"/);
  assert.match(netlifyConfig, /\[context\.deploy-preview\][\s\S]*command = "npm run build:netlify"/);
  assert.doesNotMatch(netlifyConfig, /CONVEX_DEPLOY_KEY\s*=/);
});
