import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateActivityIdeas } from "../scripts/validate-activity-ideas.mjs";

const register = JSON.parse(
  await readFile(new URL("../web/data/activity-ideas.json", import.meta.url), "utf8"),
);
const page = await readFile(new URL("../web/app/activities/page.tsx", import.meta.url), "utf8");
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

test("activity register is public but every operational feature is disabled", () => {
  assert.deepEqual(register.feature_flags, {
    proposal_intake: false,
    activity_activation: false,
    payments: false,
    badges: false,
    vouchers: false,
  });
  assert.equal(
    register.ideas.every((idea) => idea.activation_allowed === false),
    true,
  );
  assert.deepEqual(validateActivityIdeas(register), { ideas: 4, active: 0 });
  assert.doesNotMatch(page, /<form|type="submit"|fetch\(|checkout|wallet/i);
});

test("paid activity concepts require lawful EUR and worker-protection gates", () => {
  const invalid = copyRegister();
  const paid = invalid.ideas.find((idea) => idea.classification === "peer_service");
  paid.compensation = "none";
  assert.throws(() => validateActivityIdeas(invalid), /EUR-only compensation/);

  paid.compensation = "eur_only";
  paid.required_gates = paid.required_gates.filter((gate) => gate !== "individual_work_rights");
  assert.throws(() => validateActivityIdeas(invalid), /individual_work_rights/);
});

test("activity activation fails closed without feature approval and evidence", () => {
  const invalid = copyRegister();
  invalid.ideas[0].activation_allowed = true;
  invalid.ideas[0].public_status = "active";
  assert.throws(() => validateActivityIdeas(invalid), /activation flag is disabled/);
});

test("activity register rejects personal or sensitive fields", () => {
  const invalid = copyRegister();
  invalid.ideas[0].email = "person@example.test";
  assert.throws(() => validateActivityIdeas(invalid), /personal or sensitive field/);
});

test("activity route is discoverable, exported, and included in the static audit", () => {
  assert.match(home, /href="\/activities"/);
  assert.match(preparation, /'activities\.html', 'activities\/index\.html'/);
  assert.match(audit, /'\/activities\/', 'activities\/index\.html'/);
});
