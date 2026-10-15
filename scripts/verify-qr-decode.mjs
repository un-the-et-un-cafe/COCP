// Optional decode check for the print QR pack: rasterises each committed SVG and decodes it
// with an independent reader (jsQR). Not part of `npm test` because it needs two dev-only
// packages; install them ad hoc (never into web/):
//   npm i --no-save jsqr@1 @resvg/resvg-js@2 && npm run verify:qr
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const dir = resolve(import.meta.dirname, "../web/public/print");
let jsQR, Resvg;
try {
  jsQR = (await import("jsqr")).default;
  ({ Resvg } = await import("@resvg/resvg-js"));
} catch {
  console.error("verify:qr needs: npm i --no-save jsqr@1 @resvg/resvg-js@2");
  process.exit(2);
}

const expected = (await readFile(resolve(dir, "calais-services.a6.url.txt"), "utf8")).trim();
const sources = { "calais-services.qr.svg": await readFile(resolve(dir, "calais-services.qr.svg"), "utf8") };
for (const size of ["a6", "a5"]) {
  const html = await readFile(resolve(dir, `calais-services.${size}.html`), "utf8");
  sources[`calais-services.${size}.html`] = html.match(/<svg[\s\S]*?<\/svg>/)[0];
}

let failed = 0;
for (const [name, svg] of Object.entries(sources)) {
  for (const width of [120, 300, 800]) {
    const img = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render();
    const decoded = jsQR(new Uint8ClampedArray(img.pixels), img.width, img.height)?.data;
    const ok = decoded === expected;
    if (!ok) failed++;
    console.log(`${ok ? "ok  " : "FAIL"} ${name} @${width}px -> ${decoded ?? "(no decode)"}`);
  }
}
if (failed) {
  console.error(`${failed} decode check(s) failed; expected ${expected}`);
  process.exit(1);
}
console.log(`All print QR codes decode to ${expected}`);
