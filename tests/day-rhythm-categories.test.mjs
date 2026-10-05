import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const schema = JSON.parse(
  await readFile(new URL("../schemas/listing.schema.json", import.meta.url), "utf8"),
);
const en = JSON.parse(await readFile(new URL("../web/locales/en.json", import.meta.url), "utf8"));
const ar = JSON.parse(await readFile(new URL("../web/locales/ar.json", import.meta.url), "utf8"));
const listings = JSON.parse(await readFile(new URL("../web/data/listings.json", import.meta.url), "utf8"));
const flags = JSON.parse(await readFile(new URL("../web/data/feature-flags.json", import.meta.url), "utf8"));

const DAY = [
  "orientation",
  "language_tandem",
  "phone_clinic",
  "bike_commons",
  "day_laundry",
  "quiet_space",
  "clothing_swap",
  "asso_cooking",
  "day_centre",
];

test("schema enum includes day-rhythm categories", () => {
  const enumVals = schema.properties.categories.items.enum;
  for (const c of DAY) assert.ok(enumVals.includes(c), c);
});

test("locale keys exist and AR day-rhythm note is flagged", () => {
  for (const c of DAY) {
    assert.ok(en.categories[c], c);
    assert.ok(ar.categories[c], c);
  }
  assert.match(en.day_rhythm_note, /not jobs|not bookings|mutual-aid/i);
  assert.doesNotMatch(en.day_rhythm_note, /\bearn\b|volunteer pay|wage/i);
  assert.equal(ar.day_rhythm_pending_human_review, true);
  assert.equal(flags.flags.day_rhythm_categories, true);
});

test("sandbox day-rhythm listings are unverified and publishable false", () => {
  const sand = listings.filter((l) => (l.tags ?? []).includes("day_rhythm"));
  assert.ok(sand.length >= 3);
  for (const l of sand) {
    assert.equal(l.publishable, false);
    assert.equal(l.verification.status, "unverified");
    assert.match(l.name, /FICTIONAL/);
  }
});
