import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { isSandboxListing } from '../../scripts/lib/sandbox-listings.mjs';

export const budgets = Object.freeze({
  totalBytes: 1_500_000,
  totalJavaScriptBytes: 750_000,
  largestJavaScriptBytes: 250_000,
  totalCssBytes: 225_000,
  routeHtmlBytes: 80_000,
  /** Designy home HTML gzip budget (inline CSS + cards). */
  homeHtmlGzipBytes: 14_336, // 14 KB
  /** Preferred total transfer for a locale home (HTML + optional enhance.js). */
  homeTotalGzipBytes: 51_200, // 50 KB
});

/** Internal, noindex QA report that names unpublishable listings, including the sandbox ones. */
export const SANDBOX_LISTING_ROUTES_ALLOWED = Object.freeze(['/readiness/listings-qa/']);

/** JS a route can load: its <script>/modulepreload assets plus their static and dynamic imports
 *  (lazy chunks such as the map view). The framework entry's route table (other pages' chunks,
 *  loaded only when navigating there) is not followed. */
export async function routeScriptClosure(html, clientDirectory) {
  const seen = new Set();
  const queue = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+\.js/g) ?? [])];
  while (queue.length) {
    const asset = queue.pop();
    if (seen.has(asset)) continue;
    seen.add(asset);
    const name = asset.split('/').pop();
    if (/^index-[\w-]+\.js$/.test(name)) continue; // vinext client entry: route table only
    const code = await readFile(new URL(`.${asset}`, clientDirectory), 'utf8').catch(() => '');
    const dir = asset.slice(0, asset.lastIndexOf('/') + 1);
    for (const m of code.matchAll(/(?:from\s*|import\s*\(\s*)["'`]\.\/([\w.-]+\.js)["'`]/g)) queue.push(dir + m[1]);
  }
  return [...seen];
}

const routes = [
  ['/', 'index.html'],
  ['/fr/', 'fr/index.html'],
  ['/en/', 'en/index.html'],
  ['/ar/', 'ar/index.html'],
  ['/card/', 'card/index.html'],
  ['/activities/', 'activities/index.html'],
  ['/accessibility/', 'accessibility/index.html'],
  ['/changes/', 'changes/index.html'],
  ['/corrections/', 'corrections/index.html'],
  ['/privacy/', 'privacy/index.html'],
  ['/readiness/', 'readiness/index.html'],
  ['/readiness/listings-qa/', 'readiness/listings-qa/index.html'],
  ['/sponsors/', 'sponsors/index.html'],
  ['/sponsors/ledger/', 'sponsors/ledger/index.html'],
  ['/sponsors/sandbox/', 'sponsors/sandbox/index.html'],
  ['/sponsors/checkout/', 'sponsors/checkout/index.html'],
  ['/sponsors/receipt/', 'sponsors/receipt/index.html'],
  ['/sponsors/ledger/batch/', 'sponsors/ledger/batch/index.html'],
  ['/need/', 'need/index.html'],
  ['/listing/', 'listing/index.html'],
];

const DIRECTORY_ROUTES = new Set(['/', '/fr/', '/en/', '/ar/', '/card/']);

/** Static artefacts copied as-is (evidence/print) — tracker + secret scan only. */
const artefactGlobs = [
  'evidence/',
  'print/',
];

const trackingSignatures = [
  'google-analytics.com',
  'googletagmanager.com',
  'connect.facebook.net',
  'static.hotjar.com',
  'cdn.mxpnl.com',
  'cdn.segment.com',
  'plausible.io/js/',
  'matomo.js',
];

const secretSignatures = [
  'CONVEX_DEPLOY_KEY',
  'CORRECTION_API_TOKEN',
  'BEGIN PRIVATE KEY',
  'authorization: bearer ',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function allowedScriptSrc(src) {
  return (
    src.startsWith('/_next/') ||
    src === '/enhance.js' ||
    src === '/sw.js'
  );
}

function allowedStylesheetHref(href) {
  return href.startsWith('/_next/') || href === '/directory.css';
}

export function auditHtml(html, route) {
  const langOk = /<html[^>]+lang="(fr|en|ar)"/i.test(html);
  assert(langOk, `${route}: missing document language fr|en|ar.`);
  if (route === '/ar/') {
    assert(/<html[^>]+dir="rtl"/i.test(html), `${route}: Arabic page must set dir=rtl on html.`);
  }
  assert(
    /<meta[^>]+name="viewport"/i.test(html),
    `${route}: missing mobile viewport metadata.`,
  );
  assert(
    /<title>[^<]+<\/title>/i.test(html),
    `${route}: missing document title.`,
  );
  assert(/<h1(?:\s|>)/i.test(html), `${route}: missing primary heading.`);
  assert(!html.includes('[copy:'), `${route}: deck fallback [copy: …] rendered (missing deck key).`);
  assert(
    !/<(?:iframe|frame|frameset|object|embed)(?:\s|>)/i.test(html),
    `${route}: embedded third-party content is forbidden.`,
  );

  for (const match of html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/gi)) {
    assert(
      allowedScriptSrc(match[1]),
      `${route}: external executable script ${match[1]} is forbidden.`,
    );
  }

  for (const match of html.matchAll(
    /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/gi,
  )) {
    assert(
      allowedStylesheetHref(match[1]),
      `${route}: external stylesheet ${match[1]} is forbidden.`,
    );
  }

  for (const match of html.matchAll(/<a[^>]+target="_blank"[^>]*>/gi)) {
    assert(
      /rel="[^"]*noreferrer[^"]*"/i.test(match[0]),
      `${route}: new-tab link must suppress referrer details.`,
    );
  }

  const allowsSearchForm = DIRECTORY_ROUTES.has(route) || route === '/corrections/';
  if (!allowsSearchForm) {
    assert(!/<form(?:\s|>)/i.test(html), `${route}: unexpected public form.`);
  }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = new URL(
      `${entry.name}${entry.isDirectory() ? '/' : ''}`,
      directory,
    );
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else {
      assert(
        entry.isFile(),
        `Unsupported artifact entry: ${fileURLToPath(path)}`,
      );
      files.push(path);
    }
  }
  return files;
}

export async function auditStaticSite(
  clientDirectory = new URL('../dist/client/', import.meta.url),
) {
  const files = await listFiles(clientDirectory);
  const sizes = await Promise.all(
    files.map(async (file) => ({ file, size: (await stat(file)).size })),
  );
  const sizeFor = (extension) =>
    sizes.filter(({ file }) => extname(fileURLToPath(file)) === extension);
  const javascript = sizeFor('.js');
  const css = sizeFor('.css');
  const totalBytes = sizes.reduce((sum, item) => sum + item.size, 0);
  const totalJavaScriptBytes = javascript.reduce(
    (sum, item) => sum + item.size,
    0,
  );
  const totalCssBytes = css.reduce((sum, item) => sum + item.size, 0);
  const largestJavaScriptBytes = Math.max(
    0,
    ...javascript.map((item) => item.size),
  );

  assert(
    totalBytes <= budgets.totalBytes,
    `Static output is ${totalBytes} bytes; budget is ${budgets.totalBytes}.`,
  );
  assert(
    totalJavaScriptBytes <= budgets.totalJavaScriptBytes,
    `JavaScript is ${totalJavaScriptBytes} bytes; budget is ${budgets.totalJavaScriptBytes}.`,
  );
  assert(
    largestJavaScriptBytes <= budgets.largestJavaScriptBytes,
    `Largest JavaScript asset is ${largestJavaScriptBytes} bytes; budget is ${budgets.largestJavaScriptBytes}.`,
  );
  assert(
    totalCssBytes <= budgets.totalCssBytes,
    `CSS is ${totalCssBytes} bytes; budget is ${budgets.totalCssBytes}.`,
  );

  for (const [route, filename] of routes) {
    const file = new URL(filename, clientDirectory);
    const html = await readFile(file, 'utf8');
    assert(
      Buffer.byteLength(html) <= budgets.routeHtmlBytes,
      `${route}: HTML exceeds ${budgets.routeHtmlBytes} bytes.`,
    );
    auditHtml(html, route);
    for (const m of html.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+)"/g)) {
      const exists = await stat(new URL(`.${m[1]}`, clientDirectory)).then(() => true, () => false);
      assert(exists, `${route}: references missing asset ${m[1]}.`);
    }
    if (['/sponsors/sandbox/', '/readiness/listings-qa/', '/sponsors/checkout/', '/sponsors/receipt/', '/sponsors/ledger/batch/'].includes(route)) {
      assert(
        /name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html) ||
          /content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(html) ||
          html.includes('noindex'),
        `${route}: sandbox/QA pages must carry a noindex robots signal.`,
      );
    }
    if (DIRECTORY_ROUTES.has(route) && route !== '/card/') {
      const gz = gzipSync(Buffer.from(html), { level: 9 }).length;
      assert(
        gz <= budgets.homeHtmlGzipBytes,
        `${route}: home HTML gzip ${gz} exceeds ${budgets.homeHtmlGzipBytes}.`,
      );
    }
  }

  // Evidence + print artefacts must exist and stay tracker-free (covered by textFiles loop).
  for (const prefix of artefactGlobs) {
    const hits = files.filter((f) => fileURLToPath(f).includes(`/${prefix}`) || fileURLToPath(f).includes(`\\${prefix}`));
    assert(hits.length > 0, `Expected static artefacts under ${prefix}`);
  }

  const textFiles = files.filter(({ pathname }) =>
    /\.(?:html|js|css|json|txt|xml|svg|webmanifest)$/.test(pathname),
  );
  for (const file of textFiles) {
    const content = (await readFile(file, 'utf8')).toLowerCase();
    const displayName = relative(
      fileURLToPath(clientDirectory),
      fileURLToPath(file),
    );
    for (const signature of trackingSignatures) {
      assert(
        !content.includes(signature),
        `${displayName}: tracking signature ${signature} is forbidden.`,
      );
    }
    for (const signature of secretSignatures) {
      assert(
        !content.includes(signature.toLowerCase()),
        `${displayName}: secret signature ${signature} reached the client artifact.`,
      );
    }
  }

  // Fictional sandbox listings must not reach any public page (HTML + its JS, lazy chunks included)
  // or any export/print artefact. Only the internal noindex QA report may name them.
  const sandbox = JSON.parse(await readFile(new URL('../data/listings.json', import.meta.url), 'utf8')).filter(isSandboxListing);
  const needles = sandbox.flatMap((l) => [l.id, l.name]);
  const shipped = [];
  for (const [route, filename] of routes) {
    if (SANDBOX_LISTING_ROUTES_ALLOWED.includes(route)) continue;
    const html = await readFile(new URL(filename, clientDirectory), 'utf8');
    shipped.push([route, html]);
    for (const asset of await routeScriptClosure(html, clientDirectory)) shipped.push([`${route} ${asset}`, await readFile(new URL(`.${asset}`, clientDirectory), 'utf8')]);
  }
  for (const file of files) {
    const rel = relative(fileURLToPath(clientDirectory), fileURLToPath(file));
    if (/^(exports|print)\//.test(rel) && ['.html', '.json', '.csv', '.txt'].includes(extname(rel))) shipped.push([rel, await readFile(file, 'utf8')]);
  }
  for (const [where, text] of shipped) {
    for (const n of needles) assert(!text.includes(n), `${where}: fictional sandbox listing "${n}" shipped.`);
  }

  // deck.ts falls back to `[copy: key]` when a key has no en text: fail the build instead.
  for (const deckFile of ['deck.json', 'deck-p3.json', 'deck-strip.json']) {
    const deck = JSON.parse(await readFile(new URL(`../app/${deckFile}`, import.meta.url), 'utf8'));
    for (const key of Object.keys(deck.fr)) {
      assert(typeof deck.en?.[key] === 'string' && deck.en[key].trim() !== '', `${deckFile}: ${key} has no en text, deck.ts would render [copy: ${key}].`);
    }
  }

  const netlifyConfiguration = await readFile(
    new URL('../../netlify.toml', import.meta.url),
    'utf8',
  );
  for (const header of [
    'Referrer-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Permissions-Policy',
    'Content-Security-Policy',
  ]) {
    assert(
      netlifyConfiguration.includes(header),
      `Netlify security header ${header} is missing.`,
    );
  }

  return {
    routes: routes.length,
    files: files.length,
    totalBytes,
    totalJavaScriptBytes,
    largestJavaScriptBytes,
    totalCssBytes,
  };
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  const result = await auditStaticSite();
  console.log(
    `Static audit passed: ${result.routes} routes, ${result.files} files, ${result.totalBytes} bytes total, ${result.totalJavaScriptBytes} bytes JavaScript, ${result.totalCssBytes} bytes CSS.`,
  );
}
