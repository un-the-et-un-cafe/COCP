import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { canonicalJson } from './release-lib.mjs';

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

convex(['import', '--replace', '--yes', '--table', 'serviceListings', ...deploymentArgs, sourcePath]);
convex([
  'run',
  ...deploymentArgs,
  'listings:recordImport',
  JSON.stringify({
    sourceHash,
    listingCount: listings.length,
    environment: production ? 'production' : 'development',
  }),
]);

console.log(`Synced ${listings.length} listings to the ${production ? 'production' : 'development'} Convex deployment.`);
