import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../web/${p}`, import.meta.url), 'utf8');
const deck = JSON.parse(read('app/deck.json'));

test('receipt shows the refund window as the deck [OFFEN] placeholder, not a day count from config', () => {
  const page = read('app/sponsors/receipt/page.tsx');
  assert.doesNotMatch(page, /settlement-config|refund_window_days/);
  for (const l of ['fr', 'en']) {
    assert.match(deck[l]['receipt.refundWindow'], /\[OFFEN/);
    assert.doesNotMatch(deck[l]['receipt.refundWindow'], /\d/);
  }
  assert.match(read('app/p3-copy.ts'), /refundWindow: d\['receipt\.refundWindow'\]/);
});

test('no tax-receipt (reçu fiscal) claim is rendered anywhere in the app', () => {
  const files = [];
  const walk = (dir) => {
    for (const e of readdirSync(new URL(`../web/${dir}`, import.meta.url), { withFileTypes: true })) {
      if (e.isDirectory()) walk(`${dir}/${e.name}`);
      else if (/\.tsx?$/.test(e.name)) files.push(`${dir}/${e.name}`);
    }
  };
  walk('app');
  for (const f of files) {
    const s = read(f);
    assert.doesNotMatch(s, /receipt\.taxReceipt|reçu fiscal|tax receipt|déductib|tax[- ]deductible/i, f);
  }
});
