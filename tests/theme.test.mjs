import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../web/app/globals.css', import.meta.url), 'utf8');
const directoryCss = await readFile(new URL('../web/public/directory.css', import.meta.url), 'utf8');

function luminance(hex) {
  const channels = hex.match(/.{2}/g).map((channel) => Number.parseInt(channel, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('flag azure from the July 2019 Calais flag revision remains as decorative accent', () => {
  assert.match(css, /--flag-azure:#12a4df/i);
  assert.match(directoryCss, /--flag-azure:#12a4df/i);
});

test('Designy brand text colour meets WCAG AA on white', () => {
  assert.match(directoryCss, /--brand:#075986/i);
  assert.ok(contrast('075986', 'ffffff') >= 4.5);
  assert.ok(contrast('12a4df', '062e46') >= 4.5);
});
