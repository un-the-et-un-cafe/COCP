import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const root = new URL('../web/', import.meta.url);
function walk(dir, ext, out = []) {
  const u = new URL(dir, root);
  if (!existsSync(u)) return out;
  for (const e of readdirSync(u, { withFileTypes: true })) {
    if (e.isDirectory()) walk(`${dir}${e.name}/`, ext, out);
    else if (ext.test(e.name)) out.push(`${dir}${e.name}`);
  }
  return out;
}

test('no [copy: …] placeholder key is shipped in app source (deck.ts fallback excepted)', () => {
  for (const f of walk('app/', /\.tsx?$/)) {
    if (f === 'app/deck.ts') continue;
    assert.ok(!readFileSync(new URL(f, root), 'utf8').includes('[copy:'), f);
  }
});

test('no [copy: …] placeholder key in the rendered HTML (when a build exists)', (t) => {
  const html = walk('dist/client/', /\.html$/).filter((f) => !f.includes('/evidence/') && !f.includes('/print/'));
  if (html.length === 0) return t.skip('no build output');
  for (const f of html) assert.ok(!readFileSync(new URL(f, root), 'utf8').includes('[copy:'), f);
});

test('every deck key the app uses exists in fr and en', () => {
  const deck = JSON.parse(readFileSync(new URL('app/deck.json', root), 'utf8'));
  for (const k of Object.keys(deck.fr)) assert.ok(deck.en[k], k);
});
