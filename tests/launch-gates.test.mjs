import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateLaunchGates } from "../scripts/validate-launch-gates.mjs";

const register = JSON.parse(
  await readFile(new URL("../web/data/launch-gates.json", import.meta.url), "utf8"),
);
const page = await readFile(new URL("../web/app/readiness/page.tsx", import.meta.url), "utf8");
const home = await readFile(new URL("../web/app/page.tsx", import.meta.url), "utf8");
const preparation = await readFile(
  new URL("../web/scripts/prepare-netlify.mjs", import.meta.url),
  "utf8",
);
const audit = await readFile(
  new URL("../web/scripts/audit-static-site.mjs", import.meta.url),
  "utf8",
);

function copyRegister() {
  return structuredClone(register);
}

test("launch register contains every required gate and blocks operations", () => {
  assert.deepEqual(validateLaunchGates(register), { total: 12, passed: 0, blocked: 12 });
  assert.equal(register.launch_state, "blocked");
  assert.equal(register.operational_activation, false);
  assert.deepEqual(register.payment_lanes, { card: false, sepa: false, base: false });
});

test("a gate cannot pass without public evidence, approval and expiry", () => {
  const invalid = copyRegister();
  invalid.gates[0].status = "passed";
  assert.throws(() => validateLaunchGates(invalid), /approval and expiry dates/);
});

test("launch and payment flags fail closed while gates remain incomplete", () => {
  const activated = copyRegister();
  activated.operational_activation = true;
  assert.throws(() => validateLaunchGates(activated), /operational activation/);

  const payment = copyRegister();
  payment.payment_lanes.card = true;
  assert.throws(() => validateLaunchGates(payment), /payment lanes cannot open/);
});

test("public approval register rejects personal approval fields", () => {
  const invalid = copyRegister();
  invalid.gates[0].email = "reviewer@example.test";
  assert.throws(() => validateLaunchGates(invalid), /personal approval field/);
});

test("readiness route is public, static, and contains no activation control", () => {
  assert.match(home, /href="\/readiness"/);
  assert.match(preparation, /'readiness\.html', 'readiness\/index\.html'/);
  assert.match(audit, /'\/readiness\/', 'readiness\/index\.html'/);
  assert.match(page, /operational launch remains blocked/);
  assert.doesNotMatch(page, /<form|type="submit"|fetch\(|checkout/i);
});
