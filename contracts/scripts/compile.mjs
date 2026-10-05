import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import solc from "solc";

const root = resolve(import.meta.dirname, "..");
export const SOURCES = ["src/SponsorshipRouter.sol", "test/mocks/MockUSDC.sol"];
export const EVM_VERSION = "cancun"; // Base L2 supports cancun opcodes

export async function compile() {
  const sources = {};
  for (const file of SOURCES) sources[file] = { content: await readFile(resolve(root, file), "utf8") };
  const input = {
    language: "Solidity",
    sources,
    settings: {
      evmVersion: EVM_VERSION,
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "evm.deployedBytecode.opcodes", "evm.methodIdentifiers"] },
      },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const problems = (output.errors ?? []).filter((e) => e.severity === "error" || e.severity === "warning");
  if (problems.length) {
    throw new Error(`solc ${solc.version()} reported:\n${problems.map((e) => e.formattedMessage).join("\n")}`);
  }
  return { compilerVersion: solc.version(), contracts: output.contracts };
}

async function main() {
  const { compilerVersion, contracts } = await compile();
  const outDir = resolve(root, "out");
  await mkdir(outDir, { recursive: true });
  for (const [file, byName] of Object.entries(contracts)) {
    for (const [name, artifact] of Object.entries(byName)) {
      await writeFile(resolve(outDir, `${name}.json`), `${JSON.stringify({ compilerVersion, source: file, ...artifact }, null, 2)}\n`);
      console.log(`compiled ${file}:${name} (${artifact.evm.deployedBytecode.object.length / 2} bytes runtime)`);
    }
  }
  console.log(`solc ${compilerVersion}, evmVersion=${EVM_VERSION}, 0 warnings`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await main();
