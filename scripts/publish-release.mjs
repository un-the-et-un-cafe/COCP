import { readFile, mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createRelease, listingsToCsv, signRelease, verifyRelease } from './release-lib.mjs';

function readArguments(values) {
  const args = {};
  for (let index = 0; index < values.length; index += 2) {
    const flag = values[index];
    const value = values[index + 1];
    if (!flag?.startsWith('--') || !value) throw new Error('Arguments must be --name value pairs.');
    args[flag.slice(2)] = value;
  }
  return args;
}

async function readJson(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function writeAtomic(path, contents) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  await writeFile(temporary, contents, { mode: 0o644 });
  await rename(temporary, path);
}

const args = readArguments(process.argv.slice(2));
for (const required of ['released-at', 'key-id', 'private-key', 'public-key']) {
  if (!args[required]) throw new Error(`Missing --${required}.`);
}

const root = resolve(import.meta.dirname, '..');
const listings = await readJson(resolve(root, 'web/data/listings.json'));
const latestPath = resolve(root, 'web/public/releases/latest.json');
const previousRelease = await readJson(latestPath);
const privateKey = await readFile(resolve(args['private-key']), 'utf8');
const publicKey = await readFile(resolve(args['public-key']), 'utf8');
const release = createRelease({
  listings,
  releasedAt: args['released-at'],
  keyId: args['key-id'],
  previousRelease,
});
const signature = signRelease(release, privateKey);
if (!verifyRelease(release, signature, publicKey)) throw new Error('The supplied public key does not verify this signing key.');

const releaseJson = `${JSON.stringify(release, null, 2)}\n`;
const signatureRecord = `${JSON.stringify({ algorithm: 'Ed25519', key_id: release.key_id, release_id: release.release_id, signature }, null, 2)}\n`;
const historyPath = resolve(root, 'web/data/release-history.json');
const history = await readJson(historyPath, []);
const summary = {
  release_id: release.release_id,
  released_at: release.released_at,
  expires_at: release.expires_at,
  key_id: release.key_id,
  listing_count: release.listing_count,
  changes: release.changes,
};
const nextHistory = [summary, ...history.filter((item) => item.release_id !== release.release_id)];
const releaseDirectory = resolve(root, 'web/public/releases');

await writeAtomic(resolve(releaseDirectory, `${release.release_id}.json`), releaseJson);
await writeAtomic(resolve(releaseDirectory, `${release.release_id}.signature.json`), signatureRecord);
await writeAtomic(latestPath, releaseJson);
await writeAtomic(resolve(releaseDirectory, 'latest.signature.json'), signatureRecord);
await writeAtomic(resolve(releaseDirectory, 'keys', `${release.key_id}.pem`), publicKey);
await writeAtomic(resolve(root, 'web/public/exports/listings.json'), `${JSON.stringify(release.listings, null, 2)}\n`);
await writeAtomic(resolve(root, 'web/public/exports/listings.csv'), listingsToCsv(release.listings));
await writeAtomic(resolve(root, 'web/data/published-listings.json'), `${JSON.stringify(release.listings, null, 2)}\n`);
await writeAtomic(historyPath, `${JSON.stringify(nextHistory, null, 2)}\n`);

console.log(`Published ${release.release_id} with ${release.listing_count} listings; commit all generated public files.`);
