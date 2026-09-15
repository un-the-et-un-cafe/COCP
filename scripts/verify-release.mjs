import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { releaseIdFor, verifyRelease } from './release-lib.mjs';

const [releasePath, signaturePath, publicKeyPath] = process.argv.slice(2);
if (!releasePath || !signaturePath || !publicKeyPath) {
  throw new Error('Usage: npm run verify:release -- RELEASE.json SIGNATURE.json PUBLIC_KEY.pem');
}

const release = JSON.parse(await readFile(resolve(releasePath), 'utf8'));
const signature = JSON.parse(await readFile(resolve(signaturePath), 'utf8'));
const publicKey = await readFile(resolve(publicKeyPath), 'utf8');

if (release.release_id !== releaseIdFor(release)) throw new Error('Release content does not match its SHA-256 identifier.');
if (signature.algorithm !== 'Ed25519' || signature.release_id !== release.release_id || signature.key_id !== release.key_id) {
  throw new Error('Signature metadata does not match the release.');
}
if (!verifyRelease(release, signature.signature, publicKey)) throw new Error('Invalid release signature.');

console.log(`Verified ${release.release_id} (${release.listing_count} listings).`);
