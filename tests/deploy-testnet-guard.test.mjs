import test from "node:test";
import assert from "node:assert/strict";
import { assertDeployAllowed } from "../contracts/scripts/deploy-testnet.mjs";

test("deploy script refuses without --testnet --confirm and key", () => {
  assert.throws(() => assertDeployAllowed([], {}), /Refusing deploy/);
  assert.throws(() => assertDeployAllowed(["--testnet"], {}), /Refusing deploy/);
  assert.throws(() => assertDeployAllowed(["--testnet", "--confirm"], {}), /BASE_SEPOLIA_DEPLOY_KEY/);
  assert.deepEqual(
    assertDeployAllowed(["--testnet", "--confirm"], { BASE_SEPOLIA_DEPLOY_KEY: "0xabc" }),
    { keyPresent: true },
  );
  assert.throws(
    () =>
      assertDeployAllowed(["--testnet", "--confirm"], {
        BASE_SEPOLIA_DEPLOY_KEY: "0xabc",
        RPC_URL: "https://mainnet.example",
      }),
    /mainnet/,
  );
});
