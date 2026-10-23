import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { generateDirectory } from '../web/scripts/generate-directory.mjs';

test('Designy generator emits FR/EN/AR with rtl, no-JS core, and home under 14 KB gzip', async () => {
  const out = await mkdtemp(join(tmpdir(), 'cocp-designy-'));
  try {
    const result = await generateDirectory({ outDir: out, now: Date.parse('2026-10-23T10:00:00Z') });
    assert.equal(result.listings, 21);
    for (const locale of ['fr', 'en', 'ar']) {
      const html = await readFile(join(out, locale, 'index.html'), 'utf8');
      assert.match(html, new RegExp(`<html lang="${locale}"`));
      if (locale === 'ar') assert.match(html, /dir="rtl"/);
      else assert.match(html, /dir="ltr"/);
      assert.match(html, /<form role="search"/);
      assert.match(html, /tel:112/);
      assert.match(html, /tel:115/);
      assert.match(html, /tel:15/);
      assert.match(html, /enhance\.js/);
      assert.ok(!html.includes('framework-'), 'no React framework chunk in directory HTML');
      assert.ok(result.sizes[locale].gzip <= 14_336, `${locale} gzip ${result.sizes[locale].gzip}`);
    }
    const card = await readFile(join(out, 'card/index.html'), 'utf8');
    assert.match(card, /@page\{size:A4/);
    assert.match(card, /112/);
    const sw = await readFile(join(out, 'sw.js'), 'utf8');
    assert.match(sw, /cocp-dir-v1/);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});
