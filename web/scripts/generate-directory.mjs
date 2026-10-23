/**
 * Generate lightweight static directory pages (/fr/, /en/, /ar/) and /card/
 * from listings + locales, matching Designy DESIGN_SPEC + mockup.html.
 * Core content works with zero JS. Optional enhance.js / sw.js enhance only.
 */
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { qrSvg, buildQrUrl } from '../../scripts/generate-qr-pack.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');
const LOCALES = ['fr', 'en', 'ar'];
const CHIP_CATS = ['all', 'food', 'water', 'showers', 'healthcare', 'legal'];

const CATEGORY_ALIASES = {
  healthcare: 'health',
  legal: 'rights',
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isCoordLabel(label) {
  return /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(label || '');
}

function humanWhere(listing) {
  if (listing.location?.address) {
    const landmark = listing.location.landmark ? ` · ${listing.location.landmark}` : '';
    return listing.location.address + landmark;
  }
  const name = listing.name || '';
  const slash = name.indexOf(' / ');
  if (slash !== -1) return name.slice(slash + 3).trim();
  if (listing.location?.label && !isCoordLabel(listing.location.label)) {
    return listing.location.label;
  }
  return null;
}

function coordsOf(listing) {
  const c = listing.location?.coordinates;
  if (!Array.isArray(c) || c.length !== 2) return null;
  // data is [lon, lat]
  return { lon: c[0], lat: c[1] };
}

function directionsHref(listing) {
  const c = coordsOf(listing);
  if (!c) return listing.location?.map_url || '#';
  const name = encodeURIComponent(listing.name || 'Calais');
  return `geo:${c.lat},${c.lon}?q=${c.lat},${c.lon}(${name})`;
}

function osmHref(listing) {
  const c = coordsOf(listing);
  if (listing.location?.map_url) return listing.location.map_url;
  if (!c) return null;
  return `https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lon}#map=17/${c.lat}/${c.lon}`;
}

function formatDate(iso, locale) {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  const tag = locale === 'fr' ? 'fr-FR' : locale === 'ar' ? 'ar' : 'en-GB';
  return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

function freshness(listing, now, t) {
  const status = listing.verification?.status || 'unverified';
  const checked = listing.verification?.checked_at;
  const expires = listing.verification?.expires_at;
  const expMs = expires ? Date.parse(expires) : NaN;
  const checkedMs = checked ? Date.parse(checked) : NaN;

  if (status === 'unverified' || status === 'suspended') {
    return { kind: 'u', className: 'u', badgeClass: 'b-warn', icon: 'i-alert', text: t.badge_unverified, checked, expired: false };
  }
  if (status === 'expired' || (Number.isFinite(expMs) && expMs <= now)) {
    const days = Number.isFinite(checkedMs) ? Math.max(0, Math.floor((now - checkedMs) / 86400000)) : null;
    const text = days != null ? t.badge_expired.replace('{n}', String(days)) : t.badge_expired_generic;
    return { kind: 'x', className: 'x', badgeClass: 'b-x', icon: 'i-clock', text, checked, expired: true };
  }
  if (Number.isFinite(expMs) && expMs - now < 48 * 3600000) {
    return { kind: 'w', className: 'u', badgeClass: 'b-warn', icon: 'i-alert', text: t.badge_due_soon, checked, expired: false };
  }
  const days = Number.isFinite(checkedMs) ? Math.max(0, Math.floor((now - checkedMs) / 86400000)) : 0;
  return {
    kind: 'v',
    className: 'v',
    badgeClass: 'b-ok',
    icon: 'i-check',
    text: t.badge_verified.replace('{n}', String(days)),
    checked,
    expired: false,
  };
}

function whenRow(listing, fresh, t) {
  const hours = listing.hours;
  if (Array.isArray(hours) && hours.length) {
    // Simple: show first window; JS could bold "today"
    const h = hours[0];
    const range = `${h.opens}–${h.closes}`;
    const days = h.days || '';
    return `<span class="when">${escapeHtml(range)}</span>${days ? ` · ${escapeHtml(days)}` : ''}`;
  }
  if (fresh.expired) {
    return escapeHtml(t.when_was_guide);
  }
  return escapeHtml(t.when_confirm);
}

function categoryLabel(cat, t) {
  if (cat === 'healthcare') return t.categories.healthcare;
  if (cat === 'legal') return t.categories.legal;
  return t.categories[cat] || cat;
}

function chipHref(locale, cat, q) {
  const params = new URLSearchParams();
  if (cat && cat !== 'all') params.set('c', cat);
  if (q) params.set('q', q);
  const qs = params.toString();
  return `/${locale}/${qs ? `?${qs}` : ''}`;
}

function sprite() {
  return `<svg style="display:none" aria-hidden="true">
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol>
<symbol id="i-alert" viewBox="0 0 24 24"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h0"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></symbol>
<symbol id="i-map" viewBox="0 0 24 24"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></symbol>
<symbol id="i-off" viewBox="0 0 24 24"><path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M12 19h0"/></symbol>
</svg>`;
}

function renderCard(listing, locale, t, now) {
  const fresh = freshness(listing, now, t);
  const where = humanWhere(listing);
  const whereText = where || (coordsOf(listing) ? t.where_coords_fallback : t.where_unknown);
  const cats = (listing.categories || []).map((c) => categoryLabel(c, t)).join(' · ');
  const searchBlob = [listing.name, whereText, listing.source?.notes, ...(listing.categories || [])].join(' ');
  const verifiedBy = listing.verification?.verified_by || listing.verification?.owner;
  const method = listing.verification?.method;
  let verBlock = '';
  if (fresh.kind === 'u') {
    verBlock = `<dl class="ver"><dt>${escapeHtml(t.source_label)}</dt><dd>${escapeHtml(listing.source?.title || '')}${listing.source?.page ? `, p. ${listing.source.page}` : ''}</dd><dt>${escapeHtml(t.verified_by)}</dt><dd>${escapeHtml(t.verified_by_nobody)}</dd></dl>`;
  } else {
    const by = verifiedBy
      ? escapeHtml(verifiedBy) + (method ? ` (${escapeHtml(method)})` : '')
      : escapeHtml(t.verified_by_nobody);
    verBlock = `<dl class="ver"><dt>${escapeHtml(t.last_checked)}</dt><dd><time datetime="${escapeHtml(listing.verification.checked_at || '')}">${escapeHtml(formatDate(listing.verification.checked_at, locale))}</time></dd><dt>${escapeHtml(t.verified_by)}</dt><dd>${by}</dd><dt>${escapeHtml(t.expires)}</dt><dd><time datetime="${escapeHtml(listing.verification.expires_at || '')}">${escapeHtml(formatDate(listing.verification.expires_at, locale))}</time></dd></dl>`;
  }
  const geo = directionsHref(listing);
  const osm = osmHref(listing);
  const dirLabel = escapeHtml(t.directions);
  const dirBtn = osm
    ? `<a class="btn p" href="${escapeHtml(geo)}"><svg class="icon" aria-hidden="true"><use href="#i-map"/></svg>${dirLabel}</a>`
    : `<a class="btn p" href="#"><svg class="icon" aria-hidden="true"><use href="#i-map"/></svg>${dirLabel}</a>`;
  // OSM fallback as secondary visually only when geo may fail — keep primary geo per spec
  const report = `<a class="btn" href="/${locale}/corrections/?listing=${escapeHtml(listing.id)}">${escapeHtml(t.report_change)}</a>`;

  return `<li class="card ${fresh.className}" data-cats="${escapeHtml((listing.categories || []).join(' '))}" data-search="${escapeHtml(searchBlob)}"><article>
   <div class="top"><span class="badge ${fresh.badgeClass}" data-checked="${escapeHtml(listing.verification?.checked_at || '')}" data-expired="${fresh.expired ? '1' : '0'}"><svg class="icon" aria-hidden="true"><use href="#${fresh.icon}"/></svg><span data-rel>${escapeHtml(fresh.text)}</span></span><span class="cat">${escapeHtml(cats)}</span></div>
   <h3>${escapeHtml(listing.name)}</h3>
   <p class="row"><svg class="icon" aria-hidden="true"><use href="#i-clock"/></svg><span>${whenRow(listing, fresh, t)}</span></p>
   <p class="row"><svg class="icon" aria-hidden="true"><use href="#i-pin"/></svg><span>${escapeHtml(whereText)}</span></p>
   ${verBlock}
   <div class="acts">${dirBtn}${report}</div>
  </article></li>`;
}

function mergeListings(published, candidates, now) {
  const released = published.filter(
    (l) =>
      l.verification?.status === 'verified' &&
      l.verification?.expires_at &&
      Date.parse(l.verification.expires_at) > now,
  );
  const ids = new Set(released.map((l) => l.id));
  return [...released, ...candidates.filter((l) => !ids.has(l.id))];
}

function renderDirectory({ locale, copy, listings, css, dataUpdated, now, q = '', c = 'all' }) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const t = copy;
  const cards = listings.map((l) => renderCard(l, locale, t, now)).join('\n  ');
  const placeCount = t.places_count.replace('{n}', String(listings.length));
  const chips = CHIP_CATS.map((cat) => {
    const label = cat === 'all' ? t.categories.all : categoryLabel(cat, t);
    const current = (c || 'all') === cat ? ' aria-current="page"' : '';
    return `<li><a href="${chipHref(locale, cat, q)}"${current}>${escapeHtml(label)}</a></li>`;
  }).join('');

  const langLinks = LOCALES.map((l) => {
    const label = l === 'ar' ? 'عربي' : l.toUpperCase();
    const cur = l === locale ? ' aria-current="page"' : '';
    return `<li><a href="/${l}/" hreflang="${l}" lang="${l}"${cur}>${label}</a></li>`;
  }).join('');

  const alts = LOCALES.map(
    (l) => `<link rel="alternate" hreflang="${l}" href="https://cocp.fr/${l}/">`,
  ).join('\n');

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(t.doc_title)}</title>
<meta name="description" content="${escapeHtml(t.doc_description)}">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${alts}
<link rel="alternate" hreflang="x-default" href="https://cocp.fr/fr/">
<style>${css}</style>
</head>
<body>
${sprite()}
<a class="skip" href="#services">${escapeHtml(t.skip)}</a>
<header><div class="wrap hd">
 <a class="logo" href="/${locale}/" aria-hidden="true">C</a>
 <div class="ttl"><b>Calais Open Commons</b><small>${escapeHtml(t.private_access)}</small></div>
 <nav aria-label="${escapeHtml(t.language)}"><ul class="lang">${langLinks}</ul></nav>
</div></header>
<section class="sos" aria-labelledby="sos"><div class="wrap">
 <h1 id="sos"><svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg>${escapeHtml(t.sos_title)}</h1>
 <ul>
  <li><a href="tel:112"><b dir="ltr">112</b><span>${escapeHtml(t.sos_112)}</span></a></li>
  <li><a href="tel:115"><b dir="ltr">115</b><span>${escapeHtml(t.sos_115)}</span></a></li>
  <li><a href="tel:15"><b dir="ltr">15</b><span>${escapeHtml(t.sos_15)}</span></a></li>
 </ul>
</div></section>
<main id="services"><div class="wrap">
 <p class="warn-banner" id="stale-data-note" role="status"><svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg><span>${escapeHtml(t.data_may_be_stale)}</span></p>
 <h2>${escapeHtml(t.directory_title)}</h2>
 <p class="lead">${escapeHtml(t.directory_intro)}</p>
 <form role="search" action="/${locale}/" method="get">
  <label class="search"><svg class="icon" aria-hidden="true"><use href="#i-search"/></svg><span class="sr">${escapeHtml(t.search_label)}</span><input type="search" name="q" placeholder="${escapeHtml(t.search_placeholder)}" autocomplete="off" value="${escapeHtml(q)}"></label>
 </form>
 <nav aria-label="${escapeHtml(t.category_label)}"><ul class="chips">${chips}</ul></nav>
 <div class="meta"><span id="result-count" aria-live="polite" data-tpl="${escapeHtml(t.places_count)}">${escapeHtml(placeCount)}</span><span>${escapeHtml(t.data_updated.replace('{date}', dataUpdated))}</span></div>
 <ul class="list" id="listing-list">
  ${cards}
 </ul>
 <p class="empty" id="empty-state">${escapeHtml(t.no_results)} <a href="/${locale}/">${escapeHtml(t.clear_filters)}</a></p>
 <p class="note" id="offline-note" role="status"><svg class="icon" aria-hidden="true"><use href="#i-off"/></svg><span>${escapeHtml(t.offline_note.replace('{date}', dataUpdated))}</span></p>
</div></main>
<footer><div class="wrap">
 <p class="priv"><svg class="icon" aria-hidden="true"><use href="#i-shield"/></svg> ${escapeHtml(t.footer_privacy)}</p>
 <ul>
  <li><a href="/${locale}/privacy/">${escapeHtml(t.nav_privacy)}</a></li>
  <li><a href="/${locale}/accessibility/">${escapeHtml(t.nav_accessibility)}</a></li>
  <li><a href="/${locale}/changes/">${escapeHtml(t.nav_changes)}</a></li>
  <li><a href="/${locale}/sponsors/">${escapeHtml(t.nav_sponsors)}</a></li>
  <li><a href="/${locale}/readiness/">${escapeHtml(t.nav_readiness)}</a></li>
  <li><a href="/${locale}/activities/">${escapeHtml(t.nav_activities)}</a></li>
  <li><a href="/card/">${escapeHtml(t.nav_card)}</a></li>
 </ul>
</div></footer>
<script src="/enhance.js" defer></script>
</body>
</html>
`;
}

function renderCardSheet({ svg, url, printed }) {
  const cell = (extra = '') => `
  <article class="qc"${extra}>
    <p class="wm">COCP</p>
    <h1>Calais services</h1>
    <p class="tri">FR · EN · عربي</p>
    <p class="em"><b dir="ltr">112</b> · <b dir="ltr">115</b> · <b dir="ltr">15</b></p>
    ${svg}
    <p class="url">${escapeHtml(url)}</p>
    <p class="tag">No account · no tracking</p>
    <p class="printed">${escapeHtml(printed)}</p>
  </article>`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>COCP — printable QR cards</title>
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="light">
<style>
@page{size:A4;margin:8mm}
*{box-sizing:border-box}
body{margin:0;font:9pt/1.35 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#000;background:#fff}
.sheet{display:grid;grid-template-columns:repeat(2,1fr);gap:4mm;padding:0}
.qc{border:1px solid #000;border-radius:3mm;padding:4mm;text-align:center;break-inside:avoid;height:54mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1mm}
.wm{margin:0;font-weight:800;letter-spacing:.12em;font-size:8pt}
h1{margin:0;font-size:11pt}
.tri{margin:0;font-size:8pt}
.em{margin:0;font-size:10pt;font-weight:700}
.qc svg{width:25mm;height:25mm;margin:1mm auto}
.url{margin:0;font:7pt/1.2 ui-monospace,Menlo,Consolas,monospace;word-break:break-all}
.tag,.printed{margin:0;font-size:7pt}
@media screen{body{background:#e8eef2;padding:16px}.sheet{max-width:210mm;margin:0 auto;background:#fff;padding:8mm;box-shadow:0 1px 6px #0002}}
@media print{nav, .screen-only{display:none!important} body{background:#fff;padding:0}}
.screen-only{margin-bottom:12px;font-size:14px}
</style>
</head>
<body>
<p class="screen-only">Print this page (A4). Eight credit-card size cards (85×54 mm). Use pure black ink.</p>
<div class="sheet">
${Array.from({ length: 8 }, () => cell()).join('\n')}
</div>
</body>
</html>`;
}

export async function generateDirectory({
  outDir = join(webRoot, 'dist/client'),
  now = Date.now(),
} = {}) {
  const css = await readFile(join(webRoot, 'public/directory.css'), 'utf8');
  const published = JSON.parse(await readFile(join(webRoot, 'data/published-listings.json'), 'utf8'));
  const candidates = JSON.parse(await readFile(join(webRoot, 'data/listings.public.json'), 'utf8'));
  const listings = mergeListings(published, candidates, now);

  const copies = {};
  for (const locale of LOCALES) {
    copies[locale] = JSON.parse(await readFile(join(webRoot, `locales/${locale}.json`), 'utf8'));
  }

  const dataUpdated = {
    fr: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(now),
    en: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(now),
    ar: new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(now),
  };

  const sizes = {};
  for (const locale of LOCALES) {
    const html = renderDirectory({
      locale,
      copy: copies[locale],
      listings,
      css,
      dataUpdated: dataUpdated[locale],
      now,
    });
    const dest = join(outDir, locale, 'index.html');
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, html);
    sizes[locale] = {
      raw: Buffer.byteLength(html),
      gzip: gzipSync(Buffer.from(html), { level: 9 }).length,
    };
  }

  // Root index: French directory (Netlify Language redirects also negotiate)
  await copyFile(join(outDir, 'fr/index.html'), join(outDir, 'index.html'));
  sizes.root = sizes.fr;

  // QR card sheet
  const origin = process.env.PUBLIC_SITE_URL || 'https://cocp.fr';
  let qrUrl;
  try {
    qrUrl = buildQrUrl(origin, '/fr/');
  } catch {
    qrUrl = 'https://cocp.fr/fr/';
  }
  const svg = qrSvg(qrUrl, { scale: 4, label: 'QR code to Calais Open Commons' });
  const printed = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(now);
  const cardHtml = renderCardSheet({ svg, url: qrUrl, printed });
  await mkdir(join(outDir, 'card'), { recursive: true });
  await writeFile(join(outDir, 'card/index.html'), cardHtml);

  // Ensure public assets are present (vinext copies public/, but be explicit)
  for (const asset of ['directory.css', 'enhance.js', 'sw.js', 'manifest.webmanifest']) {
    try {
      await copyFile(join(webRoot, 'public', asset), join(outDir, asset));
    } catch {
      /* public copy may already exist via vinext */
    }
  }

  return { listings: listings.length, sizes, locales: LOCALES };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const out = process.argv.includes('--out')
    ? process.argv[process.argv.indexOf('--out') + 1]
    : join(webRoot, 'dist/client');
  const result = await generateDirectory({ outDir: out });
  console.log(
    `Generated directory for ${result.locales.join(', ')} (${result.listings} listings). ` +
      `Home gzip: fr=${result.sizes.fr.gzip}B en=${result.sizes.en.gzip}B ar=${result.sizes.ar.gzip}B`,
  );
}
