#!/usr/bin/env node
/**
 * Base Sepolia deploy for SponsorshipRouter.
 * HARD RULE: refuses unless ALL of:
 *   --testnet
 *   --confirm
 *   BASE_SEPOLIA_DEPLOY_KEY env (testnet-only key; never commit)
 * Does NOT run by default. Jakob must explicitly OK a real deploy.
 */
import { pathToFileURL } from "node:url";

export function assertDeployAllowed(argv = process.argv.slice(2), env = process.env) {
  const hasTestnet = argv.includes("--testnet");
  const hasConfirm = argv.includes("--confirm");
  if (!hasTestnet || !hasConfirm) {
    throw new Error(
      "Refusing deploy: pass --testnet --confirm explicitly. Mainnet is forbidden. Needs Jakob OK + dedicated testnet key.",
    );
  }
  const key = env.BASE_SEPOLIA_DEPLOY_KEY || env.PRIVATE_KEY;
  if (!key) {
    throw new Error("Refusing deploy: set BASE_SEPOLIA_DEPLOY_KEY (testnet-only). Never commit keys.");
  }
  if (/mainnet|MAINNET/.test(env.RPC_URL ?? "")) {
    throw new Error("Refusing deploy: RPC_URL looks like mainnet.");
  }
  return { keyPresent: true };
}

async function main() {
  assertDeployAllowed();
  // Intentionally not implemented beyond the guard: real broadcast needs Jakob OK.
  console.error(
    "Deploy guards passed, but broadcast is intentionally not automated in this slice. Use Foundry/cast manually after Jakob OK, then write addresses to web/data/base-deployment.testnet.json.",
  );
  process.exit(2);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main();
}
