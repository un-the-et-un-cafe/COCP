import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../web/app/page.tsx', import.meta.url), 'utf8');
const publicListings = await readFile(new URL('../web/data/published-listings.json', import.meta.url), 'utf8');
const candidateListings = JSON.parse(await readFile(new URL('../web/data/listings.json', import.meta.url), 'utf8'));
const sponsorPage = await readFile(new URL('../web/app/sponsors/page.tsx', import.meta.url), 'utf8');
const requirements = await readFile(new URL('../requirements.md', import.meta.url), 'utf8');
const manifest = JSON.parse(await readFile(new URL('../web/package.json', import.meta.url), 'utf8'));
const dependencies = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).join('\n');

test('beneficiary-facing page has no sponsor attribution or payment calls', () => {
  for (const forbidden of ['referralCode', 'campaignId', 'checkout', 'paymentToken', 'adminWallet']) {
    assert.equal(page.includes(forbidden), false, `public page contains forbidden ${forbidden} boundary`);
  }
});

test('beneficiary-facing directory restores source leads without claiming verification', () => {
  assert.match(page, /published-listings\.json/);
  assert.match(page, /data\/listings\.json/);
  assert.match(page, /Date\.parse\(listing\.verification\.expires_at\) > currentTime/);
  assert.match(page, /copy\.unverified/);
  assert.match(page, /copy\.confirm_service/);
  assert.deepEqual(JSON.parse(publicListings), []);
  assert.equal(candidateListings.length, 21);
  assert.equal(candidateListings.filter((listing) => listing.categories.includes('showers')).length, 3);
});

test('beneficiary-facing bundle declares no wallet SDK', () => {
  assert.doesNotMatch(dependencies, /\b(viem|wagmi|ethers|web3|rainbowkit|walletconnect)\b/i);
});

test('directory does not rank by sponsorship', () => {
  assert.doesNotMatch(page, /sort\s*\([^)]*(sponsor|payment|amount|tier)/i);
});

test('sponsorship information remains separate and cannot collect payment', () => {
  assert.doesNotMatch(sponsorPage, /data\/listings|checkout|paymentToken|adminWallet|wallet SDK/i);
  assert.match(sponsorPage, /paiements ne sont pas encore activés/i);
});

test('continuous-development plan preserves the full net-profit donation rule', () => {
  assert.match(requirements, /100% of net profit must be donated/i);
  assert.match(requirements, /never ranked or changed by payment/i);
});
