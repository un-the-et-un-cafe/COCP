import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../web/app/emergency-strip.tsx', import.meta.url), 'utf8');

test('emergency buttons are ordered 115, 112, 15, then shelter tonight', () => {
  const order = ['href="tel:115"', 'href="tel:112"', 'href="tel:15"', 'href="/shelter-tonight"'].map((s) => src.indexOf(s));
  assert.ok(order.every((i) => i >= 0), 'all four buttons present');
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test('17 and 114 are tappable', () => {
  assert.match(src, /href="tel:17"/);
  assert.match(src, /href="sms:114"/);
});

test('17 and 114 are 48px call buttons, not inline text links', () => {
  assert.match(src, /className="call-btn call-btn-2" href="tel:17"/);
  assert.match(src, /className="call-btn call-btn-2" href="sms:114"/);
});

test('public Part 1 pages link to no third-party map', () => {
  for (const f of ['page.tsx', 'listing/page.tsx', 'need-view.tsx', 'listing-ui.tsx']) {
    const s = readFileSync(new URL(`../web/app/${f}`, import.meta.url), 'utf8');
    assert.doesNotMatch(s, /map_url|openstreetmap|target="_blank"/i, f);
  }
});
