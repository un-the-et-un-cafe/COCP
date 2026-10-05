import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../web/app/page.tsx', import.meta.url), 'utf8');
const publicListings = await readFile(new URL('../web/data/published-listings.json', import.meta.url), 'utf8');
const candidateListings = JSON.parse(await readFile(new URL('../web/data/listings.json', import.meta.url), 'utf8'));
const sponsorPage = await readFile(new URL('../web/app/sponsors/page.tsx', import.meta.url), 'utf8');
const sponsorLedgerPage = await readFile(new URL('../web/app/sponsors/ledger/page.tsx', import.meta.url), 'utf8');
const netlifyPreparation = await readFile(new URL('../web/scripts/prepare-netlify.mjs', import.meta.url), 'utf8');
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
  assert.ok(candidateListings.length >= 21);
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
  assert.match(sponsorPage, /href="\/sponsors\/ledger"/);
  assert.doesNotMatch(sponsorLedgerPage, /data\/listings|checkout|paymentToken|adminWallet|wallet SDK/i);
  assert.match(sponsorLedgerPage, /Payments remain disabled/);
  assert.match(netlifyPreparation, /'sponsors\/ledger\.html', 'sponsors\/ledger\/index\.html'/);
});

test('continuous-development plan preserves the full net-profit donation rule', () => {
  assert.match(requirements, /100% of net profit must be donated/i);
  assert.match(requirements, /never ranked or changed by payment/i);
  assert.match(sponsorPage, /100% of net profit is transferred monthly to named local charities or founder housing support/i);
});

const sandboxPage = await readFile(new URL('../web/app/sponsors/sandbox/page.tsx', import.meta.url), 'utf8');

test('sponsor sandbox explains Model B and has no wallet connect', () => {
  assert.match(sandboxPage, /card or SEPA|carte ou SEPA/i);
  assert.match(sandboxPage, /crypto settlement|règlement crypto/i);
  assert.doesNotMatch(sandboxPage, /connectWallet|wagmi|viem|ethers|walletconnect/i);
  assert.doesNotMatch(sandboxPage, /<form/i);
  assert.doesNotMatch(sandboxPage, /js\.stripe\.com|@stripe|Stripe\(/);
  // Documentary "Test checkout" panel is OK when flags are false (no Stripe loaded).
  assert.match(sandboxPage, /test-checkout-panel/);
});

test('sandbox, QA and evidence routes are non-indexed via Netlify headers', async () => {
  const toml = await readFile(new URL('../netlify.toml', import.meta.url), 'utf8');
  for (const route of ['/sponsors/sandbox/*', '/readiness/listings-qa/*', '/evidence/*']) {
    assert.ok(toml.includes(`for = "${route}"`), route);
  }
  assert.match(toml, /X-Robots-Tag = "noindex, nofollow"/);
});

test('beneficiary routes declare no Stripe SDK or checkout', () => {
  assert.doesNotMatch(dependencies, /@stripe|stripe-js/i);
  assert.doesNotMatch(page, /js\.stripe\.com|Stripe\(|pk_live|pk_test|sk_/);
  assert.doesNotMatch(page, /checkout|PaymentElement/i);
});

test('sandbox has no Stripe when testmode flags are false', async () => {
  const flags = JSON.parse(await readFile(new URL('../web/data/feature-flags.json', import.meta.url), 'utf8'));
  assert.equal(flags.flags.payments_card_testmode_ui, false);
  assert.equal(flags.flags.payments_sepa_testmode_ui, false);
  assert.doesNotMatch(sandboxPage, /js\.stripe\.com|@stripe|Stripe\(/);
});
