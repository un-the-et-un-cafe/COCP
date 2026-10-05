import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import qrcode from "./vendor/qrcode-generator.mjs";

/**
 * Print QR pack (WP-D). Real, scannable QR (ISO/IEC 18004) via the vendored MIT
 * qrcode-generator. Payload is exactly PUBLIC_SITE_URL + deep link (default /#emergency):
 * no query string, no UTM, no per-card id => no tracking / no profiling possible from scans.
 */

export const QR_ECC_LEVEL = "M"; // ~15% recovery: survives creases/smudges on printed cards
export const QR_QUIET_ZONE = 4; // modules, per spec minimum
const PLACEHOLDER_ORIGIN_RE = /(^|\.)example\.(org|com|net)$/i;

export function assertPrintableOrigin(origin) {
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    throw new Error("PUBLIC_SITE_URL must be an https origin");
  }
  if (parsed.protocol !== "https:") throw new Error("PUBLIC_SITE_URL must be an https origin");
  if (parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.username || parsed.password) {
    throw new Error("PUBLIC_SITE_URL must be a bare origin (no path, query, hash or credentials)");
  }
  return parsed;
}

export function buildQrUrl(origin, deepLink = "/#emergency") {
  assertPrintableOrigin(origin);
  const url = new URL(deepLink, origin);
  if (url.search) throw new Error("QR deep link must not carry a query string (no tracking parameters)");
  return url.toString();
}

/** Returns a boolean matrix (true = dark module) without quiet zone. */
export function qrMatrix(text, eccLevel = QR_ECC_LEVEL) {
  const qr = qrcode(0, eccLevel); // 0 = auto-select smallest version
  qr.addData(text, "Byte");
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, row) => Array.from({ length: n }, (_, col) => qr.isDark(row, col)));
}

/** Standalone SVG (crisp vector for print). One <path> keeps the file small. */
export function qrSvg(text, { scale = 4, quietZone = QR_QUIET_ZONE, label = "QR code" } = {}) {
  const matrix = qrMatrix(text);
  const size = matrix.length + quietZone * 2;
  let d = "";
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix.length; x++) {
      if (matrix[y][x]) d += `M${x + quietZone} ${y + quietZone}h1v1h-1z`;
    }
  }
  const px = size * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="${label}"><rect width="${size}" height="${size}" fill="#fff"/><path fill="#000" d="${d}"/></svg>`;
}

export function buildPrintCard({ origin, deepLink = "/#emergency", size = "A6" }) {
  const url = buildQrUrl(origin, deepLink);
  const draft = PLACEHOLDER_ORIGIN_RE.test(new URL(origin).hostname);
  const svg = qrSvg(url, { scale: size === "A5" ? 5 : 4, label: "QR code to the Calais services directory" });
  const page = size === "A5" ? "@page { size: A5; margin: 10mm; }" : "@page { size: A6; margin: 8mm; }";
  const draftBanner = draft
    ? `\n  <p class="draft">DRAFT — placeholder origin. Regenerate with PUBLIC_SITE_URL before printing.</p>`
    : "";
  return {
    url,
    draft,
    svg,
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Calais services — FR/EN/AR</title>
  <meta name="robots" content="noindex,nofollow" />
  <style>
    ${page}
    body { font-family: system-ui, sans-serif; text-align: center; color: #111; }
    h1 { font-size: 1.1rem; margin: 0 0 0.4rem; }
    p { font-size: 0.85rem; margin: 0.3rem 0; }
    .wordmark { letter-spacing: 0.08em; font-weight: 700; }
    .ar { direction: rtl; unicode-bidi: isolate; }
    svg { margin: 0.8rem auto; display: block; }
    .url { font-size: 0.7rem; word-break: break-all; }
    .draft { border: 2px solid #b00; color: #b00; font-weight: 700; padding: 0.2rem; }
  </style>
</head>
<body>${draftBanner}
  <p class="wordmark">COCP</p>
  <h1>Calais services — FR / EN / AR</h1>
  <p>Confirm place and time before travelling · Confirmez le lieu et l’horaire avant de vous déplacer</p>
  <p class="ar" lang="ar">تأكد من المكان والوقت قبل التنقل</p>
  ${svg}
  <p class="url">${url}</p>
  <p>COCP wordmark only. No tracking.</p>
</body>
</html>`,
  };
}

async function main() {
  const origin = process.env.PUBLIC_SITE_URL || "https://cocp.example.org";
  const root = resolve(import.meta.dirname, "..");
  const outDir = resolve(root, "web/public/print");
  await mkdir(outDir, { recursive: true });
  let draft = false;
  for (const size of ["A6", "A5"]) {
    const card = buildPrintCard({ origin, size });
    draft = card.draft;
    const base = `calais-services.${size.toLowerCase()}`;
    await writeFile(resolve(outDir, `${base}.html`), card.html);
    await writeFile(resolve(outDir, `${base}.url.txt`), `${card.url}\n`);
  }
  await writeFile(resolve(outDir, "calais-services.qr.svg"), `${qrSvg(buildQrUrl(origin), { scale: 10 })}\n`);
  console.log(`Wrote print QR pack for ${buildQrUrl(origin)}${draft ? " (DRAFT: placeholder origin)" : ""}`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
