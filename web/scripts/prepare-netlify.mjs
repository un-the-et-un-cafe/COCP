import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateDirectory } from './generate-directory.mjs';

const client = new URL('../dist/client/', import.meta.url);
const prerendered = new URL('../dist/server/prerendered-routes/', import.meta.url);

const pages = [
  ['index.html', 'index.html'],
  ['activities.html', 'activities/index.html'],
  ['accessibility.html', 'accessibility/index.html'],
  ['privacy.html', 'privacy/index.html'],
  ['shelter-tonight.html', 'shelter-tonight/index.html'],
  ['need.html', 'need/index.html'],
  ['listing.html', 'listing/index.html'],
  ['readiness.html', 'readiness/index.html'],
  ['readiness/listings-qa.html', 'readiness/listings-qa/index.html'],
  ['readiness/association-wallets.html', 'readiness/association-wallets/index.html'],
  ['corrections.html', 'corrections/index.html'],
  ['changes.html', 'changes/index.html'],
  ['sponsors.html', 'sponsors/index.html'],
  ['sponsors/ledger.html', 'sponsors/ledger/index.html'],
  ['sponsors/sandbox.html', 'sponsors/sandbox/index.html'],
  ['sponsors/checkout.html', 'sponsors/checkout/index.html'],
  ['sponsors/receipt.html', 'sponsors/receipt/index.html'],
  ['sponsors/ledger/batch.html', 'sponsors/ledger/batch/index.html'],
  ['404.html', '404.html'],
];

for (const [source, destination] of pages) {
  const output = new URL(destination, client);
  await mkdir(new URL('./', output), { recursive: true });
  await copyFile(new URL(source, prerendered), output);
  // vinext emits a modulepreload for the CSS-only chunk of a side-effect `import './x.css'`
  // (secondary.css) but writes no such JS file: drop preloads that point at nothing.
  const html = await readFile(output, 'utf8');
  let fixed = html;
  for (const m of html.matchAll(/<link rel="modulepreload" href="(\/_next\/static\/[^"]+\.js)"[^>]*\/?>/g)) {
    const exists = await access(new URL(`.${m[1]}`, client)).then(() => true, () => false);
    if (!exists) fixed = fixed.replace(m[0], '');
  }
  if (fixed !== html) await writeFile(output, fixed);
}

// Designy redesign: overwrite home with zero-JS locale directories + /card/
const outDir = fileURLToPath(client);
const dirResult = await generateDirectory({ outDir });

const secondary = [
  'privacy',
  'accessibility',
  'changes',
  'sponsors',
  'sponsors/ledger',
  'readiness',
  'activities',
  'corrections',
  'shelter-tonight',
  'need',
  'listing',
];
const redirectLines = [
  '/api/corrections /.netlify/functions/corrections 200',
  '/ /fr/ 302 Language=fr',
  '/ /en/ 302 Language=en',
  '/ /ar/ 302 Language=ar',
  '/ /fr/ 302',
];
for (const locale of ['fr', 'en', 'ar']) {
  for (const route of secondary) {
    redirectLines.push(`/${locale}/${route}/ /${route}/ 200`);
    redirectLines.push(`/${locale}/${route} /${route}/ 200`);
  }
}

await writeFile(new URL('_redirects', client), `${redirectLines.join('\n')}\n`);

console.log(
  `Prepared ${pages.length} static routes + Designy directory (${dirResult.listings} listings; fr gzip ${dirResult.sizes.fr.gzip} B) for Netlify in ${join('dist', 'client')}.`,
);
