import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const z = JSON.parse(readFileSync(new URL('../web/data/zones.json', import.meta.url), 'utf8'));
// Generous Calais commune bounds (lon, lat), WGS84.
const B = { minLon: 1.75, maxLon: 1.98, minLat: 50.9, maxLat: 51.0 };

function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function segmentsIntersect(p1, p2, p3, p4) {
  const d1 = cross(p3, p4, p1), d2 = cross(p3, p4, p2), d3 = cross(p1, p2, p3), d4 = cross(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

test('zones have unique ids and orders, fr/en names, and the OSM source', () => {
  assert.ok(Array.isArray(z.zones) && z.zones.length > 0);
  assert.equal(new Set(z.zones.map((x) => x.id)).size, z.zones.length);
  assert.equal(new Set(z.zones.map((x) => x.order)).size, z.zones.length);
  for (const x of z.zones) assert.ok(x.name.fr && x.name.en, x.id);
  assert.match(z.source, /OpenStreetMap/);
  assert.match(z.note, /[Aa]pproximate/);
});

test('every ring is closed, has valid coordinates inside Calais, and does not self-intersect', () => {
  for (const { id, polygon: r } of z.zones) {
    assert.ok(r.length >= 4, `${id}: at least 3 distinct points`);
    assert.deepEqual(r[0], r[r.length - 1], `${id}: ring closed`);
    for (const p of r) {
      assert.equal(p.length, 2, id);
      assert.ok(p.every(Number.isFinite), id);
      assert.ok(p[0] >= B.minLon && p[0] <= B.maxLon && p[1] >= B.minLat && p[1] <= B.maxLat, `${id}: ${p} outside Calais bounds`);
    }
    const n = r.length - 1;
    for (let i = 0; i < n; i++)
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue; // adjacent through the closing vertex
        assert.ok(!segmentsIntersect(r[i], r[i + 1], r[j], r[j + 1]), `${id}: edges ${i} and ${j} cross`);
      }
    let area = 0;
    for (let i = 0; i < n; i++) area += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
    assert.ok(Math.abs(area) > 0, `${id}: non-degenerate`);
  }
});
