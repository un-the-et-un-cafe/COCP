// Per-route transfer budget (gzip) for the static Netlify build.
// Designy locale homes: HTML ≤14 KB gz, total (HTML+enhance) ≤50 KB gz preferred / hard ≤50 KB.
// Vinext secondary routes keep the prior React/RSC floor limits.
import { readFile, readdir, access } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const KB = 1024;
const HOME_LIMITS = { html: 14 * KB, total: 50 * KB };
const SECONDARY_LIMITS = { total: 175 * KB, css: 25 * KB, js: 160 * KB };
const TARGET_JS = 120 * KB;
const root = new URL('../dist/client/', import.meta.url).pathname;
const HOME_ROUTES = new Set(['/', '/fr/', '/en/', '/ar/']);

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
  const route = '/' + file.slice(root.length).replace(/index\.html$/, '');
  const htmlGz = gzipSync(html).length;

  if (HOME_ROUTES.has(route)) {
    let enhance = 0;
    try {
      await access(join(root, 'enhance.js'));
      enhance = await gz(join(root, 'enhance.js'));
    } catch { /* optional */ }
    const total = htmlGz + enhance;
    const over = [];
    if (htmlGz > HOME_LIMITS.html) over.push('html');
    if (total > HOME_LIMITS.total) over.push('total');
    if (over.length) failed = true;
    console.log(`${over.length ? 'FAIL' : 'ok  '} ${route} home HTML ${(htmlGz / KB).toFixed(1)} KB gz, +enhance ${(enhance / KB).toFixed(1)} KB = ${(total / KB).toFixed(1)} KB (limits ${HOME_LIMITS.html / KB}/${HOME_LIMITS.total / KB})`);
    continue;
  }

  const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+\.(?:js|css)/g) ?? [])];
  let js = 0, css = 0;
  for (const a of assets) (a.endsWith('.css') ? (css += await gz(join(root, a))) : (js += await gz(join(root, a))));
  const total = js + css + htmlGz;
  const over = [];
  if (total > SECONDARY_LIMITS.total) over.push('total');
  if (css > SECONDARY_LIMITS.css) over.push('css');
  if (js > SECONDARY_LIMITS.js) over.push('js');
  if (over.length) failed = true;
  const warn = js > TARGET_JS ? ` (JS above ${TARGET_JS / KB} KB target)` : '';
  console.log(`${over.length ? 'FAIL' : 'ok  '} ${route} total ${(total / KB).toFixed(1)} KB, JS ${(js / KB).toFixed(1)} KB, CSS ${(css / KB).toFixed(1)} KB gz${warn}`);
}
if (failed) {
  console.error('Budget exceeded.');
  process.exit(1);
}
