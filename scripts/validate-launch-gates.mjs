import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const requiredGateIds = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G7A", "G7B", "G7C", "G8", "G9"];
const statuses = new Set(["pending", "blocked", "passed"]);
const forbiddenKeys =
  /^(?:name|email|phone|walletAddress|identityDocument|signature|personalAddress)$/i;

function fail(message) {
  throw new Error(`Launch gate validation failed: ${message}`);
}

function findForbiddenKey(value, path = "$") {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const result = findForbiddenKey(value[index], `${path}[${index}]`);
      if (result) return result;
    }
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenKeys.test(key)) return `${path}.${key}`;
      const result = findForbiddenKey(child, `${path}.${key}`);
      if (result) return result;
    }
  }
  return null;
}

export function validateLaunchGates(register, now = Date.now()) {
  if (!register || typeof register !== "object") fail("register must be an object.");
  if (register.version !== 1) fail("version must be 1.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(register.updated_at ?? ""))
    fail("updated_at must be an ISO date.");
  if (!Array.isArray(register.gates)) fail("gates must be an array.");
  if (findForbiddenKey(register)) fail("public register contains a personal approval field.");

  const ids = register.gates.map((gate) => gate.id);
  if (JSON.stringify(ids) !== JSON.stringify(requiredGateIds))
    fail("gate IDs or order do not match G1–G9 requirements.");

  let passed = 0;
  for (const gate of register.gates) {
    if (!statuses.has(gate.status)) fail(`${gate.id}: status is invalid.`);
    if (!Array.isArray(gate.owner_roles) || gate.owner_roles.length === 0)
      fail(`${gate.id}: owner roles are required.`);
    if (!Array.isArray(gate.implemented_controls) || !Array.isArray(gate.evidence))
      fail(`${gate.id}: controls and evidence must be arrays.`);
    for (const locale of ["fr", "en", "ar"]) {
      if (!gate.title?.[locale]?.trim() || !gate.pass_condition?.[locale]?.trim())
        fail(`${gate.id}: ${locale} public text is required.`);
    }

    if (gate.status === "passed") {
      passed += 1;
      if (!gate.approved_at || !gate.expires_at)
        fail(`${gate.id}: passed gate needs approval and expiry dates.`);
      if (Date.parse(gate.expires_at) <= now) fail(`${gate.id}: passed gate is expired.`);
      if (gate.evidence.length === 0) fail(`${gate.id}: passed gate needs public evidence.`);
      for (const evidence of gate.evidence) {
        if (!/^https:\/\//.test(evidence.url ?? "") || !evidence.label?.trim())
          fail(`${gate.id}: evidence requires an HTTPS URL and label.`);
      }
    } else if (gate.approved_at !== null || gate.expires_at !== null || gate.evidence.length > 0) {
      fail(`${gate.id}: non-passed gate cannot publish approval evidence.`);
    }
  }

  const allPassed = passed === requiredGateIds.length;
  if (register.launch_state !== (allPassed ? "ready" : "blocked"))
    fail("launch_state does not match gate results.");
  if (typeof register.operational_activation !== "boolean")
    fail("operational activation flag is invalid.");
  if (register.operational_activation && !allPassed)
    fail("operational activation requires every launch gate to pass.");

  const lanes = register.payment_lanes;
  if (!lanes || !["card", "sepa", "base"].every((lane) => typeof lanes[lane] === "boolean"))
    fail("payment lane flags are invalid.");
  if (!allPassed && Object.values(lanes).some(Boolean))
    fail("payment lanes cannot open while launch gates are incomplete.");
  if (lanes.card || lanes.sepa) {
    if (register.gates.find((gate) => gate.id === "G7A")?.status !== "passed")
      fail("fiat lanes require G7A.");
  }
  if (lanes.base) {
    for (const id of ["G8", "G9"])
      if (register.gates.find((gate) => gate.id === id)?.status !== "passed")
        fail(`Base lane requires ${id}.`);
  }

  return { total: requiredGateIds.length, passed, blocked: requiredGateIds.length - passed };
}

async function main() {
  const register = JSON.parse(
    await readFile(new URL("../web/data/launch-gates.json", import.meta.url), "utf8"),
  );
  const result = validateLaunchGates(register);
  console.log(
    `Validated ${result.total} launch gates; ${result.passed} passed and ${result.blocked} blocking launch.`,
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
