import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { calculateChanges, canonicalJson, createRelease, listingsToCsv, releaseIdFor, signRelease, verifyRelease } from '../scripts/release-lib.mjs';

function listing(id, overrides = {}) {
  return {
    id,
    name: `Service ${id}`,
    categories: ['food'],
    audience: ['all'],
    location: { label: 'Calais', coordinates: null, map_url: null },
    contact: {},
    source: { title: 'Reviewed source', page: 1, notes: 'Reviewed public information.' },
    verification: { status: 'verified', checked_at: '2026-09-01T00:00:00.000Z', expires_at: '2026-10-01T00:00:00.000Z', owner: 'review-team' },
    publishable: true,
    ...overrides,
  };
}

test('signed releases are deterministic and verifiable', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const release = createRelease({ listings: [listing('beta'), listing('alpha')], releasedAt: '2026-09-15T00:00:00.000Z', keyId: 'release-2026' });
  const signature = signRelease(release, privateKey);
  assert.equal(release.listings[0].id, 'alpha');
  assert.match(release.release_id, /^sha256-[a-f0-9]{64}$/);
  assert.equal(release.release_id, releaseIdFor(release));
  assert.equal(verifyRelease(release, signature, publicKey), true);
  assert.equal(verifyRelease({ ...release, listing_count: 3 }, signature, publicKey), false);
  assert.equal(canonicalJson({ b: 1, a: 2 }), '{"a":2,"b":1}');
});

test('release creation rejects expired or incomplete publication claims', () => {
  assert.throws(() => createRelease({ listings: [listing('expired', { verification: { status: 'verified', checked_at: '2026-08-01T00:00:00.000Z', expires_at: '2026-09-14T00:00:00.000Z', owner: 'review-team' } })], releasedAt: '2026-09-15T00:00:00.000Z', keyId: 'release-2026' }), /expired/);
  assert.throws(() => createRelease({ listings: [listing('blocked', { publishable: false })], releasedAt: '2026-09-15T00:00:00.000Z', keyId: 'release-2026' }), /empty signed release/);
});

test('change logs and CSV exports remain portable', () => {
  const changes = calculateChanges([listing('old'), listing('same')], [listing('same'), listing('new')]);
  assert.deepEqual(changes, { added: ['new'], updated: [], removed: ['old'] });
  const csv = listingsToCsv([listing('quoted', { name: 'Food, water and advice' })]);
  assert.match(csv, /"Food, water and advice"/);
  assert.equal(csv.trim().split('\n').length, 2);
});
