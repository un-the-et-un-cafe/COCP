// Fictional sandbox/demo listings (e.g. the day-rhythm sandbox set) must never reach a public help
// page, an export or the production directory. A listing is sandbox if its id starts with
// "sandbox-", any tag starts with "sandbox", or its name is marked FICTIONAL.
export function isSandboxListing(listing) {
  if (!listing || typeof listing !== 'object') return false;
  if (typeof listing.id === 'string' && listing.id.startsWith('sandbox-')) return true;
  if (Array.isArray(listing.tags) && listing.tags.some((t) => String(t).toLowerCase().startsWith('sandbox'))) return true;
  if (typeof listing.name === 'string' && /FICTIONAL/i.test(listing.name)) return true;
  return false;
}

export const publicListings = (listings) => listings.filter((l) => !isSandboxListing(l));
