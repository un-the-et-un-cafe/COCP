import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../web/app/globals.css', import.meta.url), 'utf8');

function luminance(hex) {
  const channels = hex.match(/.{2}/g).map((channel) => Number.parseInt(channel, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('theme uses the blue from the July 2019 Calais flag revision', () => {
  assert.match(css, /--brand:#12a4df/i);
});

test('accessible companion colours preserve normal-text contrast', () => {
  assert.ok(contrast('075986', 'ffffff') >= 4.5);
  assert.ok(contrast('12a4df', '062e46') >= 4.5);
});
