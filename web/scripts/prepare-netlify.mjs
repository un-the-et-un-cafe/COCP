import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const client = new URL('../dist/client/', import.meta.url);
const prerendered = new URL('../dist/server/prerendered-routes/', import.meta.url);

const pages = [
  ['index.html', 'index.html'],
  ['corrections.html', 'corrections/index.html'],
  ['sponsors.html', 'sponsors/index.html'],
  ['404.html', '404.html'],
];

for (const [source, destination] of pages) {
  const output = new URL(destination, client);
  await mkdir(new URL('./', output), { recursive: true });
  await copyFile(new URL(source, prerendered), output);
}

await writeFile(
  new URL('_redirects', client),
  '/api/corrections /.netlify/functions/corrections 200\n',
);

console.log(`Prepared ${pages.length} static routes for Netlify in ${join('dist', 'client')}.`);
