import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { validateSettlementRehearsalDraft } from "./validate-sponsor-ledger.mjs";

async function main() {
  const draft = JSON.parse(
    await readFile(new URL("../web/data/settlement-rehearsal.draft.json", import.meta.url), "utf8"),
  );
  const result = validateSettlementRehearsalDraft(draft);
  console.log(`Validated settlement rehearsal draft: ${result.rows} rows.`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
