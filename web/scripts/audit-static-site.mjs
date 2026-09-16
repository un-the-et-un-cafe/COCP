import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const budgets = Object.freeze({
  totalBytes: 1_500_000,
  totalJavaScriptBytes: 750_000,
  largestJavaScriptBytes: 250_000,
  totalCssBytes: 225_000,
  routeHtmlBytes: 80_000,
});

const routes = [
  ['/', 'index.html'],
  ['/activities/', 'activities/index.html'],
  ['/accessibility/', 'accessibility/index.html'],
  ['/changes/', 'changes/index.html'],
  ['/corrections/', 'corrections/index.html'],
  ['/privacy/', 'privacy/index.html'],
  ['/readiness/', 'readiness/index.html'],
  ['/sponsors/', 'sponsors/index.html'],
  ['/sponsors/ledger/', 'sponsors/ledger/index.html'],
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

export function auditHtml(html, route) {
  assert(
    /<html[^>]+lang="fr"/i.test(html),
    `${route}: missing default document language.`,
  );
  assert(
    /<meta[^>]+name="viewport"/i.test(html),
    `${route}: missing mobile viewport metadata.`,
  );
  assert(
    /<title>[^<]+<\/title>/i.test(html),
    `${route}: missing document title.`,
  );
  assert(/<h1(?:\s|>)/i.test(html), `${route}: missing primary heading.`);
  assert(
    !/<(?:iframe|frame|frameset|object|embed)(?:\s|>)/i.test(html),
    `${route}: embedded third-party content is forbidden.`,
  );

  for (const match of html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/gi)) {
    assert(
      match[1].startsWith('/_next/'),
      `${route}: external executable script ${match[1]} is forbidden.`,
    );
  }

  for (const match of html.matchAll(
    /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/gi,
  )) {
    assert(
      match[1].startsWith('/_next/'),
      `${route}: external stylesheet ${match[1]} is forbidden.`,
    );
  }

  for (const match of html.matchAll(/<a[^>]+target="_blank"[^>]*>/gi)) {
    assert(
      /rel="[^"]*noreferrer[^"]*"/i.test(match[0]),
      `${route}: new-tab link must suppress referrer details.`,
    );
  }

  if (route !== '/corrections/') {
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
  }

  const textFiles = files.filter(({ pathname }) =>
    /\.(?:html|js|css|json|txt|xml|svg)$/.test(pathname),
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

  const netlifyConfiguration = await readFile(
    new URL('../../netlify.toml', import.meta.url),
    'utf8',
  );
  for (const header of [
    'Referrer-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Permissions-Policy',
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
