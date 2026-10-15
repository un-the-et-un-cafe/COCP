import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildPrintCard, buildQrUrl, qrMatrix, qrSvg, QR_QUIET_ZONE } from "../scripts/generate-qr-pack.mjs";

const printDir = new URL("../web/public/print/", import.meta.url);

test("print QR pack points at https origin with emergency deep link and no analytics", () => {
  const card = buildPrintCard({ origin: "https://cocp.example.org", deepLink: "/#emergency" });
  assert.equal(card.url, "https://cocp.example.org/#emergency");
  assert.match(card.html, /Calais services — FR \/ EN \/ AR/);
  assert.match(card.html, /confirm place and time before travelling/i);
  assert.match(card.html, /COCP/);
  assert.doesNotMatch(card.html, /google-analytics|gtag|plausible|segment|mixpanel|facebook/i);
  assert.doesNotMatch(card.html, /<img|<script/i);
});

test("placeholder origin is flagged as draft; real origin is not", () => {
  assert.equal(buildPrintCard({ origin: "https://cocp.example.org" }).draft, true);
  assert.match(buildPrintCard({ origin: "https://cocp.example.org" }).html, /DRAFT — placeholder origin/);
  const real = buildPrintCard({ origin: "https://calais.example-commons.fr" });
  assert.equal(real.draft, false);
  assert.doesNotMatch(real.html, /DRAFT/);
});

test("QR payload rejects non-https, paths, query strings and tracking params", () => {
  assert.throws(() => buildQrUrl("http://cocp.example.org"), /https origin/);
  assert.throws(() => buildQrUrl("https://cocp.example.org/sub"), /bare origin/);
  assert.throws(() => buildQrUrl("https://cocp.example.org?utm_source=x"), /bare origin/);
  assert.throws(() => buildQrUrl("https://cocp.example.org", "/?utm_source=card#emergency"), /query string/);
});

test("QR matrix is a real ISO 18004 symbol (version size + finder + timing patterns)", () => {
  const m = qrMatrix("https://cocp.example.org/#emergency");
  const n = m.length;
  assert.equal((n - 17) % 4, 0, "size must be 17 + 4*version");
  const finder = (r0, c0) => {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++) {
        const ring = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        assert.equal(m[r0 + r][c0 + c], ring || core, `finder at ${r0},${c0}`);
      }
  };
  finder(0, 0);
  finder(0, n - 7);
  finder(n - 7, 0);
  for (let i = 8; i < n - 8; i++) {
    assert.equal(m[6][i], i % 2 === 0, "horizontal timing pattern");
    assert.equal(m[i][6], i % 2 === 0, "vertical timing pattern");
  }
  assert.equal(m[n - 8][8], true, "dark module");
});

test("committed print pack matches the generator output for its own URL", async () => {
  const url = (await readFile(new URL("calais-services.a6.url.txt", printDir), "utf8")).trim();
  assert.equal((await readFile(new URL("calais-services.a5.url.txt", printDir), "utf8")).trim(), url);
  const svg = await readFile(new URL("calais-services.qr.svg", printDir), "utf8");
  assert.equal(svg.trim(), qrSvg(url, { scale: 10 }));
  assert.match(svg, new RegExp(`viewBox="0 0 ${qrMatrix(url).length + 2 * QR_QUIET_ZONE} `));
  for (const size of ["A6", "A5"]) {
    const html = await readFile(new URL(`calais-services.${size.toLowerCase()}.html`, printDir), "utf8");
    const origin = new URL(url).origin;
    assert.equal(html, buildPrintCard({ origin, size }).html, `${size} card is stale; run npm run generate:qr-pack`);
  }
});
