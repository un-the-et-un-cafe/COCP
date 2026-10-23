import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../web/${p}`, import.meta.url), 'utf8');

test('Part 1 directory body has no payment/checkout wording (Designy footer may link Fund verification)', () => {
  // Vinext interim page stays free of sponsor/readiness chrome in the React tree.
  const src = read('app/page.tsx');
  assert.doesNotMatch(src, /href="\/sponsors|href="\/readiness/);
  assert.doesNotMatch(src, /checkout|paymentToken|adminWallet|js\.stripe/i);

  // Designy static home: footer may link Fund verification / launch status per DESIGN_SPEC,
  // but the directory cards and SOS band must not carry payment CTAs.
  const generator = read('scripts/generate-directory.mjs');
  assert.doesNotMatch(generator, /checkout|paymentToken|adminWallet|js\.stripe|referralCode/i);
  assert.match(generator, /nav_sponsors|Fund verification|Financer/);

  const out = new URL('../web/dist/client/index.html', import.meta.url);
  if (existsSync(out)) {
    const html = readFileSync(out, 'utf8');
    assert.doesNotMatch(html, /checkout|paymentToken|adminWallet|js\.stripe|Add to cart|Payer maintenant/i);
    // Cards must not embed sponsor attribution
    assert.doesNotMatch(html, /class="card"[^>]*>[\s\S]{0,800}sponsor/i);
  }
});

test('the transparency pages stay reachable from a neutral page', () => {
  assert.match(read('app/changes/page.tsx'), /href="\/sponsors\/ledger"/);
});
