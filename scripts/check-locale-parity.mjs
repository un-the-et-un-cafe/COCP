import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

function flatten(value, prefix = "") {
  const keys = [];
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${key}` : key;
      keys.push(...flatten(child, next));
    }
  } else {
    keys.push(prefix);
  }
  return keys;
}

export async function checkLocaleParity(rootUrl = new URL("../web/locales/", import.meta.url)) {
  const fr = JSON.parse(await readFile(new URL("fr.json", rootUrl), "utf8"));
  const en = JSON.parse(await readFile(new URL("en.json", rootUrl), "utf8"));
  const ar = JSON.parse(await readFile(new URL("ar.json", rootUrl), "utf8"));
  const frKeys = new Set(flatten(fr));
  const enKeys = new Set(flatten(en));
  const arKeys = new Set(flatten(ar));
  const missingEn = [...frKeys].filter((k) => !enKeys.has(k)).sort();
  const missingAr = [...frKeys].filter((k) => !arKeys.has(k)).sort();
  const extraEn = [...enKeys].filter((k) => !frKeys.has(k)).sort();
  const extraAr = [...arKeys].filter((k) => !frKeys.has(k)).sort();
  if (missingEn.length || missingAr.length || extraEn.length || extraAr.length) {
    throw new Error(
      `Locale parity failed: missingEn=${missingEn.join(",") || "∅"} missingAr=${missingAr.join(",") || "∅"} extraEn=${extraEn.join(",") || "∅"} extraAr=${extraAr.join(",") || "∅"}`,
    );
  }
  return { keys: frKeys.size };
}

async function main() {
  const result = await checkLocaleParity();
  console.log(`Locale parity OK across FR/EN/AR (${result.keys} keys).`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
