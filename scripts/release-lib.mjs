import { createHash, sign, verify } from 'node:crypto';

export const RELEASE_FORMAT = 'cocp-listing-release/v1';

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function selectPublishableListings(listings, releasedAt) {
  const now = Date.parse(releasedAt);
  if (!Number.isFinite(now)) throw new Error('releasedAt must be a valid ISO date-time.');

  return listings
    .filter((listing) => listing.publishable === true)
    .map((listing) => {
      const checkedAt = Date.parse(listing.verification?.checked_at ?? '');
      const expiresAt = Date.parse(listing.verification?.expires_at ?? '');
      if (listing.verification?.status !== 'verified' || !listing.verification?.owner) {
        throw new Error(`${listing.id}: publishable listing lacks verified status or an owner.`);
      }
      if (!Number.isFinite(checkedAt) || checkedAt > now) {
        throw new Error(`${listing.id}: checked_at must be valid and no later than the release.`);
      }
      if (!Number.isFinite(expiresAt) || expiresAt <= now) {
        throw new Error(`${listing.id}: publishable listing is expired.`);
      }
      return listing;
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function calculateChanges(previousListings = [], nextListings = []) {
  const previous = new Map(previousListings.map((listing) => [listing.id, canonicalJson(listing)]));
  const next = new Map(nextListings.map((listing) => [listing.id, canonicalJson(listing)]));
  const added = [...next.keys()].filter((id) => !previous.has(id)).sort();
  const updated = [...next.keys()].filter((id) => previous.has(id) && previous.get(id) !== next.get(id)).sort();
  const removed = [...previous.keys()].filter((id) => !next.has(id)).sort();
  return { added, updated, removed };
}

export function releaseIdFor(release) {
  const { release_id: ignored, ...body } = release;
  return `sha256-${createHash('sha256').update(canonicalJson(body)).digest('hex')}`;
}

export function createRelease({ listings, releasedAt, keyId, previousRelease = null }) {
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(keyId)) throw new Error('keyId has an invalid format.');
  const published = selectPublishableListings(listings, releasedAt);
  if (published.length === 0) throw new Error('Refusing to create an empty signed release.');
  const expiresAt = published.reduce((earliest, listing) => {
    const value = listing.verification.expires_at;
    return earliest === null || value < earliest ? value : earliest;
  }, null);
  const body = {
    format: RELEASE_FORMAT,
    released_at: new Date(releasedAt).toISOString(),
    expires_at: expiresAt,
    key_id: keyId,
    listing_count: published.length,
    changes: calculateChanges(previousRelease?.listings, published),
    listings: published,
  };
  return { ...body, release_id: releaseIdFor(body) };
}

export function signRelease(release, privateKey) {
  return sign(null, Buffer.from(canonicalJson(release)), privateKey).toString('base64');
}

export function verifyRelease(release, signature, publicKey) {
  return verify(null, Buffer.from(canonicalJson(release)), publicKey, Buffer.from(signature, 'base64'));
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join('|') : String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function listingsToCsv(listings) {
  const rows = [['id', 'name', 'categories', 'audience', 'location', 'map_url', 'checked_at', 'expires_at']];
  for (const listing of listings) {
    rows.push([
      listing.id,
      listing.name,
      listing.categories,
      listing.audience,
      listing.location.label,
      listing.location.map_url,
      listing.verification.checked_at,
      listing.verification.expires_at,
    ]);
  }
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}
