import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;

function fail(msg) {
  throw new Error(`Association wallet registry: ${msg}`);
}

function checksumOk(addr) {
  // Accept any EIP-55 or lowercase 40-hex; reject wrong length / non-hex.
  return ADDR_RE.test(addr);
}

export function validateAssociationWalletRegistry(doc) {
  if (!doc || typeof doc !== "object") fail("document must be an object.");
  if (doc.version !== 1) fail("version must be 1.");
  if (!Array.isArray(doc.entries)) fail("entries must be an array.");
  const ids = new Set();
  const wallets = new Set();
  for (const [i, e] of doc.entries.entries()) {
    const at = `entries[${i}]`;
    if (!e.association_id || typeof e.association_id !== "string") fail(`${at}.association_id required`);
    if (ids.has(e.association_id)) fail(`duplicate association_id ${e.association_id}`);
    ids.add(e.association_id);
    if (!e.display_name?.includes("FICTIONAL")) fail(`${at} display_name must be marked FICTIONAL while no real MOU`);
    if (e.fictional !== true) fail(`${at}.fictional must be true in sandbox`);
    if (e.chain !== "base-sepolia") fail(`${at}.chain must be base-sepolia`);
    if (!checksumOk(e.wallet_address)) fail(`${at}.wallet_address invalid`);
    const w = e.wallet_address.toLowerCase();
    if (wallets.has(w)) fail(`duplicate wallet ${e.wallet_address}`);
    wallets.add(w);
    if (e.reviewer_a === e.reviewer_b) fail(`${at} reviewer_a must differ from reviewer_b`);
    if (!e.reviewer_a || !e.reviewer_b) fail(`${at} dual reviewers required`);
    if (!e.reviewed_at || Number.isNaN(Date.parse(e.reviewed_at))) fail(`${at}.reviewed_at invalid`);
    if (typeof e.mou_flag !== "boolean") fail(`${at}.mou_flag required`);
    if (typeof e.active !== "boolean") fail(`${at}.active required`);
    if (!e.verification_evidence_path) fail(`${at}.verification_evidence_path required`);
  }
  return { entries: doc.entries.length, active: doc.entries.filter((e) => e.active).length };
}

export function findEligibleAssociation(doc, associationId) {
  const e = (doc.entries ?? []).find((x) => x.association_id === associationId);
  if (!e) throw new Error(`unknown association ${associationId}`);
  if (!e.active) throw new Error(`association ${associationId} inactive`);
  if (!e.mou_flag) throw new Error(`association ${associationId} mou_flag false — cannot settle`);
  if (e.reviewer_a === e.reviewer_b) throw new Error(`association ${associationId} dual review incomplete`);
  return e;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const doc = JSON.parse(
    await readFile(new URL("../web/data/association-wallet-registry.sandbox.json", import.meta.url), "utf8"),
  );
  const r = validateAssociationWalletRegistry(doc);
  console.log(`Validated association wallet registry: ${r.entries} entries (${r.active} active).`);
}
