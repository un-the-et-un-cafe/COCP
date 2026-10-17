import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const web = new URL('../web/', import.meta.url);
const read = (p) => readFileSync(new URL(p, web), 'utf8');
const secondaryPages = ['accessibility', 'activities', 'changes', 'corrections', 'privacy', 'readiness', 'readiness/association-wallets', 'readiness/listings-qa', 'sponsors', 'sponsors/checkout', 'sponsors/ledger', 'sponsors/ledger/batch', 'sponsors/receipt', 'sponsors/sandbox'];
const part1Pages = ['', 'need', 'listing', 'shelter-tonight'];

test('pages outside Part 1 import secondary.css; Part 1 pages do not', () => {
  for (const p of secondaryPages) assert.match(read(`app/${p}/page.tsx`), /import '(\.\.\/)+secondary\.css';/, p);
  for (const p of part1Pages) assert.ok(!read(`app/${p ? p + '/' : ''}page.tsx`).includes('secondary.css'), p || '/');
  for (const f of readdirSync(new URL('app/', web))) if (/\.(tsx|ts)$/.test(f) && f !== 'page.tsx') assert.ok(!read(`app/${f}`).includes('secondary.css'), f);
});

test('built Part 1 HTML does not link secondary.css; others do; no dangling modulepreload', (t) => {
  const dist = new URL('dist/client/', web);
  if (!existsSync(new URL('index.html', dist))) return t.skip('no build output');
  for (const p of part1Pages) assert.ok(!/secondary\.[\w-]+\.css/.test(read(`dist/client/${p ? p + '/' : ''}index.html`)), p || '/');
  for (const p of secondaryPages) {
    const html = read(`dist/client/${p}/index.html`);
    assert.match(html, /secondary\.[\w-]+\.css/, p);
    for (const m of html.matchAll(/href="(\/_next\/static\/[^"]+)"/g)) assert.ok(existsSync(new URL(`.${m[1]}`, dist)), `${p} ${m[1]}`);
  }
});
