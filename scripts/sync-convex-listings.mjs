import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { canonicalJson } from './release-lib.mjs';
import { buildServiceListingsPayload } from './lib/convex-listings-payload.mjs';

const netlifyProduction = process.argv.includes('--netlify-production');
const production = netlifyProduction || process.argv.includes('--prod');
if (netlifyProduction && (process.env.NETLIFY !== 'true' || process.env.CONTEXT !== 'production' || !process.env.CONVEX_DEPLOY_KEY)) {
  throw new Error('Netlify production sync requires its production context and CONVEX_DEPLOY_KEY.');
}
if (production && !netlifyProduction && !process.argv.includes('--confirm-production')) {
  throw new Error('Production sync requires --prod --confirm-production.');
}

const root = resolve(import.meta.dirname, '..');
const web = resolve(root, 'web');
const sourcePath = resolve(web, 'data/listings.json');
const listings = JSON.parse(await readFile(sourcePath, 'utf8'));
const sourceHash = `sha256-${createHash('sha256').update(canonicalJson(listings)).digest('hex')}`;
// Sandbox listings stay out of Convex and non-schema fields are stripped, so the schema stays strict.
const { payload, excluded, stripped } = buildServiceListingsPayload(listings);
if (excluded.length) console.log(`Not imported (sandbox): ${excluded.join(', ')}`);
for (const s of stripped) console.log(`Stripped non-schema fields from ${s.id}: ${s.fields.join(', ')}`);
const payloadDir = await mkdtemp(join(tmpdir(), 'cocp-listings-'));
const payloadPath = join(payloadDir, 'serviceListings.json');
await writeFile(payloadPath, JSON.stringify(payload));
const deploymentArgs = production && !process.env.CONVEX_DEPLOY_KEY ? ['--prod'] : [];

function convex(args) {
  const result = spawnSync('npx', ['convex', ...args], { cwd: web, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Convex command failed with exit code ${result.status}.`);
}

if (netlifyProduction) {
  convex(['deploy', '--cmd', 'npm run build:netlify', '--cmd-url-env-var-name', 'VITE_CONVEX_URL']);
} else if (production) convex(['deploy']);
else convex(['dev', '--once']);

convex(['import', '--replace', '--yes', '--table', 'serviceListings', ...deploymentArgs, payloadPath]);
await rm(payloadDir, { recursive: true, force: true });
convex([
  'run',
  ...deploymentArgs,
  'listings:recordImport',
  JSON.stringify({
    sourceHash,
    listingCount: payload.length,
    environment: production ? 'production' : 'development',
  }),
]);

console.log(`Synced ${payload.length} listings to the ${production ? 'production' : 'development'} Convex deployment.`);
