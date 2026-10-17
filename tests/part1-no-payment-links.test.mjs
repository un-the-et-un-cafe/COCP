import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../web/${p}`, import.meta.url), 'utf8');

test('Part 1 home links to no sponsor/readiness page (spec §1.6: no payment wording in Part 1)', () => {
  const src = read('app/page.tsx');
  assert.doesNotMatch(src, /href="\/sponsors|href="\/readiness/);
  const out = new URL('../web/dist/client/index.html', import.meta.url);
  if (existsSync(out)) {
    const html = readFileSync(out, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
    assert.doesNotMatch(html, /href="\/sponsors|Financer|Fund verification|paiement|payment/i);
  }
});

test('the transparency pages stay reachable from a neutral page', () => {
  assert.match(read('app/changes/page.tsx'), /href="\/sponsors\/ledger"/);
});
