import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (p) => readFile(new URL(`../web/app/${p}`, import.meta.url), "utf8");

test("USDC-on-Base chip is on sponsor + ledger pages only, with sandbox proof and no invented hashes", async () => {
  const chip = await read("usdc-proof.tsx");
  for (const s of ["USDC sur Base", "USDC on Base", "USDC على Base", "exemple / sandbox"]) assert.ok(chip.includes(s), s);
  assert.doesNotMatch(chip, /0x[0-9a-fA-F]{8,}/);
  assert.match(await read("sponsors/page.tsx"), /<UsdcProof locale=\{locale\} proofHref="\/sponsors\/ledger"/);
  assert.match(await read("sponsors/ledger/page.tsx"), /<UsdcProof /);
  assert.doesNotMatch(await read("page.tsx"), /UsdcProof|USDC/);
});
