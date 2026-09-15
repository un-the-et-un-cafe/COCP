import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schema = await readFile(new URL('../web/convex/schema.ts', import.meta.url), 'utf8');
const functions = await readFile(new URL('../web/convex/listings.ts', import.meta.url), 'utf8');
const http = await readFile(new URL('../web/convex/http.ts', import.meta.url), 'utf8');
const syncScript = await readFile(new URL('../scripts/sync-convex-listings.mjs', import.meta.url), 'utf8');
const page = await readFile(new URL('../web/app/page.tsx', import.meta.url), 'utf8');
const netlifyConfig = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');
const webManifest = JSON.parse(await readFile(new URL('../web/package.json', import.meta.url), 'utf8'));

test('Convex stores listings and a separately auditable sync record', () => {
  assert.match(schema, /serviceListings: defineTable/);
  assert.match(schema, /directorySync: defineTable/);
  assert.match(schema, /\.index\('by_listingId', \['id'\]\)/);
  assert.match(functions, /export const recordImport = internalMutation/);
  assert.match(functions, /uniqueIds\.size !== listings\.length/);
});

test('listing sync is explicit and production requires confirmation', () => {
  assert.match(syncScript, /convex\(\['import', '--replace', '--yes', '--table', 'serviceListings'/);
  assert.match(syncScript, /--confirm-production/);
  assert.match(syncScript, /NETLIFY !== 'true'/);
  assert.match(syncScript, /CONTEXT !== 'production'/);
  assert.match(syncScript, /canonicalJson\(listings\)/);
});

test('ChatGPT hosting is development while only Netlify production syncs production data', () => {
  assert.equal(webManifest.scripts['deploy:netlify'], 'node ../scripts/sync-convex-listings.mjs --netlify-production');
  assert.match(netlifyConfig, /\[context\.production\][\s\S]*deploy:netlify/);
  assert.match(netlifyConfig, /\[context\.deploy-preview\][\s\S]*build:netlify/);
  assert.doesNotMatch(netlifyConfig, /CONVEX_DEPLOY_KEY\s*=/);
});

test('the directory exposes live Convex sync state without hiding bundled data', () => {
  assert.match(http, /path: '\/directory-status'/);
  assert.match(http, /internal\.listings\.getStatus/);
  assert.match(page, /VITE_CONVEX_SITE_URL/);
  assert.match(page, /status\.sourceHash === expectedSourceHash/);
  assert.match(page, /databaseStatus\.state === 'synced'/);
  assert.match(page, /syncedAt: status\.syncedAt/);
  assert.match(page, /setDatabaseCheck\(\(attempt\) => attempt \+ 1\)/);
  assert.match(page, /database_unavailable/);
});
