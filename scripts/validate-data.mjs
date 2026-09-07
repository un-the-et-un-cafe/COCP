import { readFile } from 'node:fs/promises';

const path = new URL('../web/data/listings.json', import.meta.url);
const listings = JSON.parse(await readFile(path, 'utf8'));
const ids = new Set();
const allowedCategories = new Set(['emergency', 'food', 'water', 'healthcare', 'community', 'legal']);
const allowedAudiences = new Set(['all', 'men', 'women_children', 'minors', 'detained']);
const errors = [];

if (!Array.isArray(listings) || listings.length !== 21) {
  errors.push(`Appendix A must contain exactly 21 consolidated candidates; found ${listings.length}.`);
}

for (const [index, listing] of listings.entries()) {
  const at = `listing[${index}]${listing?.id ? ` (${listing.id})` : ''}`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(listing.id ?? '')) errors.push(`${at}: invalid stable id.`);
  if (ids.has(listing.id)) errors.push(`${at}: duplicate id.`);
  ids.add(listing.id);
  if (!listing.name?.trim()) errors.push(`${at}: name is required.`);
  if (!listing.categories?.length || listing.categories.some((value) => !allowedCategories.has(value))) errors.push(`${at}: invalid categories.`);
  if (!listing.audience?.length || listing.audience.some((value) => !allowedAudiences.has(value))) errors.push(`${at}: invalid audience.`);
  if (!listing.location?.label?.trim()) errors.push(`${at}: public location label is required.`);
  if (!listing.source?.title?.includes('New Arrival Guide') || ![1, 2].includes(listing.source?.page)) errors.push(`${at}: Appendix A source and page are required.`);
  if (!listing.source?.notes?.trim()) errors.push(`${at}: source notes are required.`);
  if (listing.verification?.status === 'unverified') {
    if (listing.publishable !== false) errors.push(`${at}: unverified content cannot be publishable.`);
    if (listing.verification.checked_at || listing.verification.expires_at || listing.verification.owner) errors.push(`${at}: unverified candidate cannot claim verification metadata.`);
  }
  if (listing.publishable === true) {
    if (listing.verification?.status !== 'verified' || !listing.verification?.checked_at || !listing.verification?.expires_at || !listing.verification?.owner) {
      errors.push(`${at}: publishable content requires complete, current verification metadata.`);
    }
  }
  const coordinates = listing.location?.coordinates;
  if (coordinates !== null && (!Array.isArray(coordinates) || coordinates.length !== 2 || Math.abs(coordinates[0]) > 180 || Math.abs(coordinates[1]) > 90)) errors.push(`${at}: invalid [longitude, latitude].`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated ${listings.length} unverified Appendix A candidates.`);
