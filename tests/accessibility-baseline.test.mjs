import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const home = await readFile(new URL("../web/app/page.tsx", import.meta.url), "utf8");
const page = await readFile(new URL("../web/app/accessibility/page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../web/app/globals.css", import.meta.url), "utf8");
const netlifyPreparation = await readFile(
  new URL("../web/scripts/prepare-netlify.mjs", import.meta.url),
  "utf8",
);

test("accessibility status is discoverable and exported as a Netlify route", () => {
  assert.match(home, /href="\/accessibility"/);
  assert.match(netlifyPreparation, /'accessibility\.html', 'accessibility\/index\.html'/);
});

test("accessibility page publishes limits without claiming conformity", () => {
  assert.match(page, /No RGAA or WCAG conformance claim is made/);
  assert.match(page, /Independent audit pending/);
  assert.match(page, /known limitations/i);
  assert.match(page, /Do not include personal data/);
  assert.match(page, /href="#accessibility-content"/);
});

test("global interaction styles respect keyboard and reduced-motion preferences", () => {
  assert.match(styles, /:focus-visible\s*\{/);
  assert.match(styles, /@media \(prefers-reduced-motion:reduce\)/);
  assert.match(styles, /scroll-behavior:auto!important/);
});
