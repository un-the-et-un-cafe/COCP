import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const root = new URL('..', import.meta.url);
const scannedRoots = ['web/app', 'web/lib', 'web/package.json', 'contracts/src'];
const sourceExtensions = new Set(['.js', '.mjs', '.ts', '.tsx', '.sol', '.json']);

async function collect(relative) {
  const path = new URL(relative, root);
  try {
    const entries = await readdir(path, { withFileTypes: true });
    const nested = await Promise.all(entries.filter((entry) => entry.name !== 'node_modules').map((entry) => collect(`${relative}/${entry.name}`)));
    return nested.flat();
  } catch (error) {
    if (error.code === 'ENOTDIR') return sourceExtensions.has(extname(relative)) ? [relative] : [];
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

test('repository excludes activity-token and market mechanisms', async () => {
  const files = (await Promise.all(scannedRoots.map(collect))).flat();
  const forbidden = [
    /ACTIVITYCOIN/i,
    /IUniswapV[23]/,
    /createPair\s*\(/,
    /addLiquidity\w*\s*\(/,
    /liquidityMining/i,
    /buyback\s*\(/i,
    /priceOracle/i,
    /redeem\w*Token\w*Voucher/i,
  ];
  for (const relative of files) {
    const text = await readFile(new URL(relative, root), 'utf8');
    for (const pattern of forbidden) assert.doesNotMatch(text, pattern, `${relative} violates token exclusion`);
  }
});

test('frontend dependencies exclude exchange and fungible-token kits', async () => {
  const manifest = JSON.parse(await readFile(new URL('../web/package.json', import.meta.url), 'utf8'));
  const names = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).join('\n');
  assert.doesNotMatch(names, /(uniswap|pancakeswap|sushiswap|dex-sdk|erc20-token)/i);
});
