// Per-route transfer budget (gzip) for the static Netlify build.
// Hard limits fail the build; TARGET_JS is the design-review goal (warn only) until the
// React/RSC/vinext runtime floor (~130 KB gz; corrections adds base-ui ~15 KB) is reduced.
import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const KB = 1024;
const LIMITS = { total: 175 * KB, css: 25 * KB, js: 160 * KB };
const TARGET_JS = 120 * KB;
const root = new URL('../dist/client/', import.meta.url).pathname;

async function htmlFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory() && e.name !== '_next' && e.name !== 'evidence') out.push(...(await htmlFiles(p)));
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

const gz = async (p) => gzipSync(await readFile(p)).length;
let failed = false;
for (const file of await htmlFiles(root)) {
  const html = await readFile(file, 'utf8');
  const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+\.(?:js|css)/g) ?? [])];
  let js = 0, css = 0;
  for (const a of assets) (a.endsWith('.css') ? (css += await gz(join(root, a))) : (js += await gz(join(root, a))));
  const total = js + css + gzipSync(html).length;
  const route = '/' + file.slice(root.length).replace(/index\.html$/, '');
  const over = [];
  if (total > LIMITS.total) over.push('total');
  if (css > LIMITS.css) over.push('css');
  if (js > LIMITS.js) over.push('js');
  if (over.length) failed = true;
  const warn = js > TARGET_JS ? ` (JS above ${TARGET_JS / KB} KB target)` : '';
  console.log(`${over.length ? 'FAIL' : 'ok  '} ${route} total ${(total / KB).toFixed(1)} KB, JS ${(js / KB).toFixed(1)} KB, CSS ${(css / KB).toFixed(1)} KB gz${warn}`);
}
if (failed) {
  console.error(`Budget exceeded (limits: total ${LIMITS.total / KB} KB, JS ${LIMITS.js / KB} KB, CSS ${LIMITS.css / KB} KB gz).`);
  process.exit(1);
}
