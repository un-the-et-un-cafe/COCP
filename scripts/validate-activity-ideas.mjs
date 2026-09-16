import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const classifications = new Set([
  "peer_service",
  "authorized_retail",
  "city_benefit_work",
  "civic_reporting",
  "community_participation",
]);
const statuses = new Set([
  "submitted",
  "triage",
  "needs_partner",
  "legally_cleared",
  "pilot",
  "active",
  "paused",
  "rejected",
]);
const compensations = new Set(["none", "expenses_only", "eur_only"]);
const sensitiveKeys =
  /^(?:name|email|phone|address|coordinates|immigrationStatus|nationality|caseHistory|campLocation|identityDocument|participantId|providerId)$/i;
const enabledStatuses = new Set(["legally_cleared", "pilot", "active"]);
const paidClassifications = new Set(["peer_service", "authorized_retail", "city_benefit_work"]);
const paidGates = [
  "operator_review",
  "individual_work_rights",
  "contract_or_invoice",
  "transparent_eur_price",
  "insurance",
];
const riskGates = {
  minors: ["safeguarding"],
  coercion: ["informed_consent", "no_work_conditioned_reward"],
  public_space: ["city_reporting_route"],
  sensitive_location: ["privacy_review"],
  tools: ["ppe", "insurance"],
  physical_safety: ["insurance"],
};

function fail(message) {
  throw new Error(`Activity idea validation failed: ${message}`);
}

function findSensitiveKey(value, path = "$") {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const result = findSensitiveKey(value[index], `${path}[${index}]`);
      if (result) return result;
    }
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (sensitiveKeys.test(key)) return `${path}.${key}`;
      const result = findSensitiveKey(child, `${path}.${key}`);
      if (result) return result;
    }
  }
  return null;
}

export function validateActivityIdeas(register) {
  if (!register || typeof register !== "object") fail("register must be an object.");
  if (register.version !== 1) fail("version must be 1.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(register.updated_at ?? ""))
    fail("updated_at must be an ISO date.");

  const flags = register.feature_flags;
  const requiredFlags = [
    "proposal_intake",
    "activity_activation",
    "payments",
    "badges",
    "vouchers",
  ];
  if (!flags || requiredFlags.some((flag) => flags[flag] !== false)) {
    fail("every MVP activity feature flag must remain false.");
  }
  if (!Array.isArray(register.ideas)) fail("ideas must be an array.");

  const sensitivePath = findSensitiveKey(register);
  if (sensitivePath) fail(`personal or sensitive field is forbidden at ${sensitivePath}.`);

  const ids = new Set();
  for (const idea of register.ideas) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(idea.id ?? "")) fail("idea id is invalid.");
    if (ids.has(idea.id)) fail(`duplicate idea id ${idea.id}.`);
    ids.add(idea.id);
    if (!classifications.has(idea.classification)) fail(`${idea.id}: classification is invalid.`);
    if (!statuses.has(idea.public_status)) fail(`${idea.id}: public status is invalid.`);
    if (!compensations.has(idea.compensation)) fail(`${idea.id}: compensation is invalid.`);
    for (const locale of ["fr", "en", "ar"]) {
      if (!idea.title?.[locale]?.trim() || !idea.value?.[locale]?.trim()) {
        fail(`${idea.id}: ${locale} title and value are required.`);
      }
    }
    if (!Array.isArray(idea.risks) || !Array.isArray(idea.required_gates)) {
      fail(`${idea.id}: risks and required gates must be arrays.`);
    }
    if (!Array.isArray(idea.gate_evidence)) fail(`${idea.id}: gate evidence must be an array.`);
    if (!idea.decision || !Array.isArray(idea.decision.conflicts))
      fail(`${idea.id}: decision record is invalid.`);

    const required = new Set(idea.required_gates);
    for (const risk of idea.risks) {
      for (const gate of riskGates[risk] ?? []) {
        if (!required.has(gate)) fail(`${idea.id}: ${risk} risk requires ${gate}.`);
      }
    }

    if (paidClassifications.has(idea.classification)) {
      if (idea.compensation !== "eur_only")
        fail(`${idea.id}: paid classifications require EUR-only compensation.`);
      for (const gate of paidGates) {
        if (!required.has(gate)) fail(`${idea.id}: paid classification requires ${gate}.`);
      }
    } else if (idea.compensation === "eur_only") {
      fail(`${idea.id}: unpaid classification cannot enable paid compensation.`);
    }

    const cleared = enabledStatuses.has(idea.public_status) || idea.activation_allowed === true;
    if (cleared) {
      if (!flags.activity_activation) fail(`${idea.id}: activation flag is disabled.`);
      if (!idea.decision.review_owner || !idea.decision.next_review_at)
        fail(`${idea.id}: cleared activity needs an owner and next review date.`);
      const evidence = new Map(idea.gate_evidence.map((entry) => [entry.gate, entry]));
      for (const gate of required) {
        const entry = evidence.get(gate);
        if (entry?.status !== "passed" || !/^https:\/\//.test(entry.evidence_url ?? "")) {
          fail(`${idea.id}: ${gate} lacks passed HTTPS evidence.`);
        }
      }
    } else if (idea.activation_allowed !== false) {
      fail(`${idea.id}: uncleared activity must explicitly deny activation.`);
    }
  }

  return {
    ideas: register.ideas.length,
    active: register.ideas.filter((idea) => idea.activation_allowed).length,
  };
}

async function main() {
  const source = new URL("../web/data/activity-ideas.json", import.meta.url);
  const register = JSON.parse(await readFile(source, "utf8"));
  const result = validateActivityIdeas(register);
  console.log(`Validated ${result.ideas} activity ideas; ${result.active} active.`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
