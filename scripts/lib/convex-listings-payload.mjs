// Builds the payload for `convex import --table serviceListings`.
// The Convex schema (web/convex/schema.ts) stays strict: sandbox listings are never imported, and
// any field the schema does not declare is stripped. tests/convex-import-payload.test.mjs validates
// the payload against the real schema export and keeps SERVICE_LISTING_FIELDS equal to it.

/** Fields of serviceListings in web/convex/schema.ts (nested objects list their own fields). */
export const SERVICE_LISTING_FIELDS = Object.freeze({
  id: true,
  name: true,
  categories: true,
  audience: true,
  location: ['label', 'coordinates', 'map_url'],
  contact: true, // v.any()
  source: ['title', 'page', 'notes'],
  verification: ['status', 'checked_at', 'expires_at', 'owner'],
  publishable: true,
});

/** Sandbox/demo listings: a sandbox-* id, a sandbox* tag, or any `tags` field at all (tags are a
 *  sandbox-only extension of the listing schema and must not reach the production directory). */
export function isSandboxListing(listing) {
  if (typeof listing?.id === 'string' && listing.id.startsWith('sandbox-')) return true;
  if (listing && Object.hasOwn(listing, 'tags')) return true;
  return false;
}

const pick = (value, keys) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(keys.filter((k) => Object.hasOwn(value, k)).map((k) => [k, value[k]]))
    : value;

export function toServiceListing(listing) {
  const out = {};
  for (const [field, spec] of Object.entries(SERVICE_LISTING_FIELDS)) {
    if (!Object.hasOwn(listing, field)) continue;
    out[field] = spec === true ? listing[field] : pick(listing[field], spec);
  }
  return out;
}

/** Returns the import payload plus what was left out, for the sync log. */
export function buildServiceListingsPayload(listings) {
  const excluded = [];
  const stripped = [];
  const payload = [];
  for (const listing of listings) {
    if (isSandboxListing(listing)) {
      excluded.push(listing.id);
      continue;
    }
    const row = toServiceListing(listing);
    const dropped = Object.keys(listing).filter((k) => !Object.hasOwn(row, k));
    for (const k of ['location', 'source', 'verification']) {
      if (listing[k] && typeof listing[k] === 'object') {
        for (const nk of Object.keys(listing[k])) if (!Object.hasOwn(row[k] ?? {}, nk)) dropped.push(`${k}.${nk}`);
      }
    }
    if (dropped.length) stripped.push({ id: listing.id, fields: dropped });
    payload.push(row);
  }
  return { payload, excluded, stripped };
}
