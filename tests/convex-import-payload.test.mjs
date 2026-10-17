import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { buildServiceListingsPayload, isSandboxListing, SERVICE_LISTING_FIELDS } from '../scripts/lib/convex-listings-payload.mjs';

const web = new URL('../web/', import.meta.url);
const listings = JSON.parse(await readFile(new URL('data/listings.json', web), 'utf8'));

// Load the real web/convex/schema.ts: transpile it with the repo's TypeScript and import it from
// web/node_modules/.cache so `convex/server` resolves; then use Convex's own schema export.
async function loadSchemaExport() {
  const ts = createRequire(new URL('package.json', web))('typescript');
  const source = await readFile(new URL('convex/schema.ts', web), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const dir = new URL('node_modules/.cache/cocp-schema-test/', web);
  await mkdir(dir, { recursive: true });
  const file = new URL(`schema-${process.pid}.mjs`, dir);
  await writeFile(file, js);
  try {
    return JSON.parse((await import(file.href)).default.export());
  } finally {
    await rm(file, { force: true });
  }
}
const schema = await loadSchemaExport();
const docType = schema.tables.find((t) => t.tableName === 'serviceListings').documentType;

/** Minimal validator for Convex's exported validator JSON (the types this schema uses). */
function check(type, value, path) {
  switch (type.type) {
    case 'any': return [];
    case 'null': return value === null ? [] : [`${path}: expected null`];
    case 'string': return typeof value === 'string' ? [] : [`${path}: expected string`];
    case 'number': return typeof value === 'number' && Number.isFinite(value) ? [] : [`${path}: expected number`];
    case 'boolean': return typeof value === 'boolean' ? [] : [`${path}: expected boolean`];
    case 'literal': return value === type.value ? [] : [`${path}: expected ${JSON.stringify(type.value)}`];
    case 'array': return Array.isArray(value) ? value.flatMap((v, i) => check(type.value, v, `${path}[${i}]`)) : [`${path}: expected array`];
    case 'union': return type.value.some((t) => check(t, value, path).length === 0) ? [] : [`${path}: matches no union member`];
    case 'object': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return [`${path}: expected object`];
      const errs = Object.keys(value).filter((k) => !Object.hasOwn(type.value, k)).map((k) => `${path}.${k}: not in schema`);
      for (const [k, f] of Object.entries(type.value)) {
        if (!Object.hasOwn(value, k)) { if (!f.optional) errs.push(`${path}.${k}: missing`); continue; }
        errs.push(...check(f.fieldType, value[k], `${path}.${k}`));
      }
      return errs;
    }
    default: return [`${path}: unsupported validator ${type.type}`];
  }
}

test('the validator rejects what Convex rejects (extra field, e.g. the raw sandbox listings)', () => {
  const raw = listings.filter((l) => Object.hasOwn(l, 'tags'));
  assert.ok(raw.length > 0, 'fixture: source has tagged sandbox listings');
  assert.ok(check(docType, raw[0], raw[0].id).some((e) => e.endsWith('.tags: not in schema')));
});

test('production import payload validates against web/convex/schema.ts', () => {
  const { payload } = buildServiceListingsPayload(listings);
  assert.ok(payload.length > 0);
  const errors = payload.flatMap((row) => check(docType, row, row.id));
  assert.deepEqual(errors, []);
  assert.equal(new Set(payload.map((r) => r.id)).size, payload.length);
});

test('production import payload contains no sandbox listings', () => {
  const { payload, excluded } = buildServiceListingsPayload(listings);
  for (const row of payload) {
    assert.ok(!row.id.startsWith('sandbox-'), row.id);
    assert.ok(!Object.hasOwn(row, 'tags'), row.id);
    assert.ok(!isSandboxListing(row), row.id);
  }
  const sandbox = listings.filter((l) => l.id.startsWith('sandbox-') || Object.hasOwn(l, 'tags') || (l.tags ?? []).some((t) => String(t).startsWith('sandbox')));
  assert.deepEqual(excluded.sort(), sandbox.map((l) => l.id).sort());
  assert.equal(payload.length + excluded.length, listings.length);
});

test('non-schema fields are stripped, nested ones too; schema-only listings pass through unchanged', () => {
  const base = listings.find((l) => !isSandboxListing(l));
  const noisy = { ...base, extra: 1, location: { ...base.location, extra: 2 }, source: { ...base.source, extra: 3 }, verification: { ...base.verification, extra: 4 } };
  const { payload, stripped } = buildServiceListingsPayload([noisy]);
  assert.deepEqual(payload[0], base);
  assert.deepEqual(stripped[0].fields.sort(), ['extra', 'location.extra', 'source.extra', 'verification.extra']);
  assert.deepEqual(check(docType, payload[0], base.id), []);
});

test('SERVICE_LISTING_FIELDS equals the serviceListings fields in schema.ts', () => {
  const fields = Object.fromEntries(Object.entries(docType.value).map(([k, f]) => [k, f.fieldType.type === 'object' ? Object.keys(f.fieldType.value) : true]));
  assert.deepEqual({ ...SERVICE_LISTING_FIELDS }, fields);
});

test('sync script imports the filtered payload, not the raw source file', async () => {
  const script = await readFile(new URL('../scripts/sync-convex-listings.mjs', import.meta.url), 'utf8');
  assert.match(script, /buildServiceListingsPayload\(listings\)/);
  assert.match(script, /'serviceListings', \.\.\.deploymentArgs, payloadPath\]/);
  assert.doesNotMatch(script, /deploymentArgs, sourcePath\]/);
  assert.match(script, /listingCount: payload\.length/);
});
