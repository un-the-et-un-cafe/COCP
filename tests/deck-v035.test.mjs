import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../web/', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('former interim strings now come from deck v0.3.5 keys', () => {
  const p1 = read('app/p1-copy.ts');
  for (const k of ['list.openNowNoHours', 'detail.what', 'detail.who', 'detail.whoAll', 'detail.details', 'common.back', 'detail.guidePage', 'detail.call']) assert.ok(p1.includes(`'${k}'`), k);
  const p3 = read('app/p3-copy.ts');
  for (const k of ['title', 'batch', 'association', 'conversion', 'rate', 'reconciliation', 'recOk', 'recMismatch', 'noTx']) assert.ok(p3.includes(`'batch.${k}'`), k);
  assert.ok(!/const extra\b/.test(p3));
  assert.ok(!read('app/map-ui.tsx').includes('Limites approximatives'));
  const deck = JSON.parse(read('app/deck.json'));
  assert.ok(deck.fr['map.approxNote'] && deck.en['map.approxNote']);
});

test('Part 1 deck carries no sponsor keys (they live in deck-p3.json)', () => {
  const p1 = JSON.parse(read('app/deck.json'));
  const p3 = JSON.parse(read('app/deck-p3.json'));
  for (const k of Object.keys(p1.fr)) assert.ok(!/^(checkout|receipt|batch|split|ledger|sponsor|stripe)\./.test(k), k);
  for (const k of ['batch.conversion', 'receipt.refundWindow', 'split.detail']) assert.ok(p3.fr[k], k);
});

test('EUR → USDC flow mirrors its arrow in RTL', () => {
  assert.match(read('app/globals.css'), /\[dir='rtl'\] \.flow-arrow \{[^}]*scaleX\(-1\)/);
  const batch = read('app/sponsors/ledger/batch/page.tsx');
  assert.ok(batch.includes('<Flow from={eur('));
  assert.ok(!/→ \{usdc/.test(batch));
});

test('build fails on a [copy:] fallback', async () => {
  const { auditHtml } = await import(new URL('scripts/audit-static-site.mjs', root));
  const ok = '<html lang="fr"><head><meta name="viewport" content="x"><title>t</title></head><body><h1>x</h1></body></html>';
  assert.doesNotThrow(() => auditHtml(ok, '/'));
  assert.throws(() => auditHtml(ok.replace('<h1>x</h1>', '<h1>[copy: detail.what]</h1>'), '/'), /copy/);
  assert.match(read('scripts/audit-static-site.mjs'), /has no en text, deck\.ts would render/);
});

test('.brand-home tap target is 48px', () => {
  assert.match(read('app/globals.css'), /\.brand-home \{[^}]*min-height:var\(--tap\)/);
});
