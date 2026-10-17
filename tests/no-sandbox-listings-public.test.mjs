import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { isSandboxListing, publicListings } from '../scripts/lib/sandbox-listings.mjs';

const web = new URL('../web/', import.meta.url);
const read = (p) => readFileSync(new URL(p, web), 'utf8');
const raw = JSON.parse(read('data/listings.json'));
const sandbox = raw.filter(isSandboxListing);
const needles = sandbox.flatMap((l) => [l.id, l.name]);

test('the three fictional sandbox listings are detected', () => {
  assert.deepEqual(sandbox.map((l) => l.id).sort(), ['sandbox-bike-commons', 'sandbox-language-tandem', 'sandbox-orientation-desk']);
  for (const l of sandbox) assert.match(l.name, /FICTIONAL/);
});

test('listings.public.json is listings.json without sandbox listings, and is up to date', () => {
  const pub = JSON.parse(read('data/listings.public.json'));
  assert.deepEqual(pub, publicListings(raw));
  assert.equal(pub.length, raw.length - sandbox.length);
  for (const l of pub) assert.ok(!isSandboxListing(l), l.id);
  execFileSync(process.execPath, [new URL('scripts/public-listings.mjs', web).pathname, '--check'], { stdio: 'pipe' });
});

test('no app/function source imports the raw listings.json', () => {
  const files = execFileSync('rg', ['--files', 'app', 'netlify', '-g', '*.ts', '-g', '*.tsx', '-g', '*.mts'], { cwd: new URL('.', web).pathname }).toString().trim().split('\n');
  for (const f of files) assert.doesNotMatch(read(f), /data\/listings\.json['"]/, f);
});

test('sync, release and exports use the public list', () => {
  const sync = readFileSync(new URL('../scripts/sync-convex-listings.mjs', import.meta.url), 'utf8');
  assert.match(sync, /const listings = publicListings\(/);
  assert.match(readFileSync(new URL('../scripts/publish-release.mjs', import.meta.url), 'utf8'), /const listings = publicListings\(/);
  for (const f of ['data/published-listings.json', 'public/exports/listings.json', 'public/exports/listings.csv']) {
    if (!existsSync(new URL(f, web))) continue;
    const text = read(f);
    for (const n of needles) assert.ok(!text.includes(n), `${f}: ${n}`);
  }
});

test('built HTML and JS of Part 1 routes contain no sandbox listing id or name (lazy chunks included)', async (t) => {
  const dist = new URL('dist/client/', web);
  if (!existsSync(new URL('index.html', dist))) return t.skip('no build output');
  const { routeScriptClosure } = await import(new URL('scripts/audit-static-site.mjs', web));
  const part1 = ['index.html', 'need/index.html', 'listing/index.html', 'shelter-tonight/index.html', 'activities/index.html', 'corrections/index.html', 'changes/index.html'];
  let sawMapChunk = false;
  for (const page of part1) {
    const html = readFileSync(new URL(page, dist), 'utf8');
    const assets = await routeScriptClosure(html, dist);
    assert.ok(assets.length > 0, page);
    if (assets.some((a) => /zone-map-/.test(a))) sawMapChunk = true;
    for (const [where, text] of [[page, html], ...assets.map((a) => [`${page} ${a}`, readFileSync(new URL(`.${a}`, dist), 'utf8')])]) {
      for (const n of needles) assert.ok(!text.includes(n), `${where}: ${n}`);
    }
  }
  assert.ok(sawMapChunk, 'the lazy map chunk is part of the /need closure and was checked');
  const walk = (dir) => readdirSync(dir).flatMap((e) => { const p = new URL(e, dir); return statSync(p).isDirectory() ? walk(new URL(`${e}/`, dir)) : [p]; });
  for (const sub of ['exports/', 'print/']) {
    if (!existsSync(new URL(sub, dist))) continue;
    for (const f of walk(new URL(sub, dist))) {
      if (!/\.(html|json|csv|txt)$/.test(f.pathname)) continue;
      const text = readFileSync(f, 'utf8');
      for (const n of needles) assert.ok(!text.includes(n), `${f.pathname}: ${n}`);
    }
  }
});

test('the build audit fails if a sandbox listing reaches a public route', () => {
  const audit = read('scripts/audit-static-site.mjs');
  assert.match(audit, /fictional sandbox listing/);
  assert.match(audit, /SANDBOX_LISTING_ROUTES_ALLOWED = Object\.freeze\(\['\/readiness\/listings-qa\/'\]\)/);
});
