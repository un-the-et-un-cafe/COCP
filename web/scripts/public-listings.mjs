// web/data/listings.public.json = web/data/listings.json without fictional sandbox listings.
// Every public page imports the public file, so sandbox listings are not in any bundle.
//   node scripts/public-listings.mjs          regenerate
//   node scripts/public-listings.mjs --check  fail if stale (run by build:netlify)
import { readFile, writeFile } from 'node:fs/promises';
import { publicListings } from '../../scripts/lib/sandbox-listings.mjs';

const src = new URL('../data/listings.json', import.meta.url);
const out = new URL('../data/listings.public.json', import.meta.url);
const expected = `${JSON.stringify(publicListings(JSON.parse(await readFile(src, 'utf8'))), null, 2)}\n`;
if (process.argv.includes('--check')) {
  const current = await readFile(out, 'utf8').catch(() => '');
  if (current !== expected) {
    console.error('web/data/listings.public.json is stale: run `npm run data:public-listings` in web/.');
    process.exit(1);
  }
  console.log('listings.public.json is up to date (sandbox listings excluded).');
} else {
  await writeFile(out, expected);
  console.log('Wrote web/data/listings.public.json.');
}
