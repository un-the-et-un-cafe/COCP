import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { analyzeListings, assertPublishableIntegrity } from "../scripts/qa-listings.mjs";

const listings = JSON.parse(
  await readFile(new URL("../web/data/listings.json", import.meta.url), "utf8"),
);

test("qa report summarises Appendix A candidates without personal data keys", () => {
  const report = analyzeListings(listings);
  assert.equal(report.total, 21);
  assert.equal(report.publishable, 0);
  assert.equal(report.unverified, 21);
  assert.equal(report.invalid_publishable.length, 0);
  assert.ok(report.missing_phone.length > 0);
  assert.ok(report.category_coverage.food);
  assert.ok(report.category_coverage.water);
  const serialised = JSON.stringify(report);
  assert.doesNotMatch(serialised, /email|walletAddress|identityDocument|personalAddress/i);
});

test("golden fixture: bad publishable row fails integrity check", () => {
  const bad = [
    {
      id: "bad-publishable",
      name: "Bad row",
      categories: ["food"],
      audience: ["all"],
      location: { label: "Calais", coordinates: null, map_url: null },
      contact: {},
      source: { title: "New Arrival Guide, English, August 2026", page: 1, notes: "x" },
      verification: {
        status: "unverified",
        checked_at: null,
        expires_at: null,
        owner: null,
      },
      publishable: true,
    },
  ];
  const report = analyzeListings(bad);
  assert.equal(report.invalid_publishable.length, 1);
  assert.throws(() => assertPublishableIntegrity(report), /invalid publishable/);
});

test("valid publishable row passes QA integrity", () => {
  const good = [
    {
      id: "good-publishable",
      name: "Good row",
      categories: ["healthcare"],
      audience: ["all"],
      location: {
        label: "Calais",
        coordinates: [1.85, 50.95],
        map_url: "https://www.openstreetmap.org/?mlat=50.95&mlon=1.85",
      },
      contact: { phone: "+33123456789" },
      hours: "Mon–Fri 09:00–12:00",
      source: { title: "New Arrival Guide, English, August 2026", page: 1, notes: "x" },
      verification: {
        status: "verified",
        checked_at: "2026-09-01T00:00:00.000Z",
        expires_at: "2026-12-01T00:00:00.000Z",
        owner: "review-team",
      },
      publishable: true,
    },
  ];
  const report = analyzeListings(good, Date.parse("2026-10-05T00:00:00.000Z"));
  assert.equal(report.invalid_publishable.length, 0);
  assert.doesNotThrow(() => assertPublishableIntegrity(report));
  assert.equal(report.missing_phone.length, 0);
  assert.equal(report.missing_hours.length, 0);
  assert.equal(report.coordinates_without_map_url.length, 0);
});
