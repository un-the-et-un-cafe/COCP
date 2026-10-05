import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const PRIORITY_CATEGORIES = ["food", "water", "healthcare", "emergency"];
// shelter maps to emergency in this schema; track emergency as shelter proxy
const SHELTER_ALIASES = ["emergency"];

function hasPhone(listing) {
  const phone = listing.contact?.phone ?? listing.contact?.tel ?? null;
  return typeof phone === "string" && phone.trim().length > 0;
}

function hasHours(listing) {
  const hours =
    listing.hours ??
    listing.opening_hours ??
    listing.contact?.hours ??
    listing.schedule ??
    null;
  if (typeof hours === "string") return hours.trim().length > 0;
  if (hours && typeof hours === "object") return Object.keys(hours).length > 0;
  // Source notes often carry schedule; treat missing dedicated hours field as gap
  return false;
}

function missingLocaleFields(listing) {
  const missing = [];
  // Names are currently scalar English; track optional localized name/description if present
  const name = listing.name;
  if (name && typeof name === "object") {
    for (const locale of ["fr", "en", "ar"]) {
      if (!name[locale]?.trim()) missing.push(`name.${locale}`);
    }
  }
  const description = listing.description;
  if (description && typeof description === "object") {
    for (const locale of ["fr", "en", "ar"]) {
      if (!description[locale]?.trim()) missing.push(`description.${locale}`);
    }
  }
  return missing;
}

function isExpired(listing, now) {
  const expires = Date.parse(listing.verification?.expires_at ?? "");
  return Number.isFinite(expires) && expires <= now;
}

/**
 * Build a listing QA report. Exit code 1 if any publishable row lacks
 * verified + checked_at + expires_at + review owner.
 */
export function analyzeListings(listings, now = Date.now()) {
  if (!Array.isArray(listings)) throw new Error("listings must be an array");

  const report = {
    generated_at: new Date(now).toISOString(),
    total: listings.length,
    unverified: 0,
    publishable: 0,
    expired: 0,
    missing_phone: [],
    missing_hours: [],
    missing_locale_fields: [],
    coordinates_without_map_url: [],
    category_gaps: {
      food: 0,
      water: 0,
      healthcare: 0,
      shelter: 0,
    },
    invalid_publishable: [],
    ids: [],
  };

  for (const listing of listings) {
    report.ids.push(listing.id);
    const status = listing.verification?.status;
    if (status === "unverified") report.unverified += 1;
    if (listing.publishable === true) report.publishable += 1;
    if (isExpired(listing, now)) report.expired += 1;
    if (!hasPhone(listing)) report.missing_phone.push(listing.id);
    if (!hasHours(listing)) report.missing_hours.push(listing.id);

    const localeGaps = missingLocaleFields(listing);
    if (localeGaps.length) {
      report.missing_locale_fields.push({ id: listing.id, fields: localeGaps });
    }

    const coords = listing.location?.coordinates;
    const hasCoords =
      Array.isArray(coords) && coords.length === 2 && coords.every((n) => typeof n === "number");
    if (hasCoords && !listing.location?.map_url) {
      report.coordinates_without_map_url.push(listing.id);
    }

    const cats = new Set(listing.categories ?? []);
    if (cats.has("food")) report.category_gaps.food += 1;
    if (cats.has("water")) report.category_gaps.water += 1;
    if (cats.has("healthcare")) report.category_gaps.healthcare += 1;
    if ([...cats].some((c) => SHELTER_ALIASES.includes(c))) report.category_gaps.shelter += 1;

    if (listing.publishable === true) {
      const v = listing.verification ?? {};
      const ok =
        v.status === "verified" &&
        typeof v.checked_at === "string" &&
        v.checked_at.trim() &&
        typeof v.expires_at === "string" &&
        v.expires_at.trim() &&
        typeof v.owner === "string" &&
        v.owner.trim();
      if (!ok) {
        report.invalid_publishable.push({
          id: listing.id,
          reason: "publishable requires verified + checked_at + expires_at + review owner",
        });
      }
    }
  }

  // category_gaps: count of listings covering each; also expose missing coverage flags
  report.category_coverage = {
    food: report.category_gaps.food > 0,
    water: report.category_gaps.water > 0,
    healthcare: report.category_gaps.healthcare > 0,
    shelter: report.category_gaps.shelter > 0,
  };

  return report;
}

export function assertPublishableIntegrity(report) {
  if (report.invalid_publishable.length > 0) {
    const details = report.invalid_publishable
      .map((row) => `${row.id}: ${row.reason}`)
      .join("; ");
    throw new Error(`Listing QA failed: invalid publishable rows — ${details}`);
  }
}

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const listings = JSON.parse(
    await readFile(resolve(root, "web/data/listings.json"), "utf8"),
  );
  const report = analyzeListings(listings);
  assertPublishableIntegrity(report);

  const outPath = resolve(root, "web/data/qa-report.json");
  await mkdir(dirname(outPath), { recursive: true });
  // Strip full id lists that are redundant for the committed artefact? Keep aggregate + gap ids.
  const publicReport = {
    // no timestamp: keeps the committed artefact deterministic across builds
    total: report.total,
    unverified: report.unverified,
    publishable: report.publishable,
    expired: report.expired,
    missing_phone_count: report.missing_phone.length,
    missing_hours_count: report.missing_hours.length,
    missing_phone: report.missing_phone,
    missing_hours: report.missing_hours,
    missing_locale_fields: report.missing_locale_fields,
    coordinates_without_map_url: report.coordinates_without_map_url,
    category_counts: report.category_gaps,
    category_coverage: report.category_coverage,
    invalid_publishable: report.invalid_publishable,
  };
  await writeFile(outPath, `${JSON.stringify(publicReport, null, 2)}\n`);

  console.log(
    `QA listings: total=${report.total} unverified=${report.unverified} publishable=${report.publishable} expired=${report.expired}; wrote ${outPath}`,
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    await main();
  } catch (error) {
    console.error(error.message ?? error);
    process.exit(1);
  }
}
