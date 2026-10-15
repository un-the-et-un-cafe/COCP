/**
 * In-process EVM rehearsal of SponsorshipRouter.payoutCharityLeg.
 * No network, no keys, no RPC. Returns a deterministic 0x+64hex "tx hash"
 * derived from the executed call's log topics + data (not a fiat-ref stub).
 */
import { createEVM } from "@ethereumjs/evm";
import { Common, Hardfork, Mainnet } from "@ethereumjs/common";
import { createAddressFromString, bytesToHex, hexToBytes } from "@ethereumjs/util";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { createHash } from "node:crypto";
import { compile } from "./compile.mjs";

const OPERATOR = "0x00000000000000000000000000000000000000a1";
const ADMIN = "0x00000000000000000000000000000000000000c3";

const selector = (sig) => bytesToHex(keccak_256(new TextEncoder().encode(sig)).slice(0, 4));
const word = (v) => {
  if (typeof v === "boolean") v = v ? 1n : 0n;
  if (typeof v === "string") v = BigInt(v);
  return v.toString(16).padStart(64, "0");
};
const encode = (sig, ...args) => selector(sig) + args.map(word).join("");

let cachedArtifacts = null;
async function artifacts() {
  if (!cachedArtifacts) cachedArtifacts = (await compile()).contracts;
  return cachedArtifacts;
}

/**
 * @param {{ association: string, amountMicro: number|bigint, fiatPaymentRef: string }} input
 * @returns {Promise<{ settlement_tx_hash: string, association: string, amount_micro: string, router: string, usdc: string }>}
 */
export async function executeRouterPayoutOnEvm({ association, amountMicro, fiatPaymentRef }) {
  if (!association || !/^0x[0-9a-fA-F]{40}$/.test(association)) {
    throw new Error("association must be a 0x-prefixed 20-byte address");
  }
  const amount = BigInt(amountMicro);
  if (amount <= 0n) throw new Error("amountMicro must be positive");

  const arts = await artifacts();
  const evm = await createEVM({ common: new Common({ chain: Mainnet, hardfork: Hardfork.Cancun }) });
  const call = async (from, to, data, value = 0n) => {
    const res = await evm.runCall({
      caller: createAddressFromString(from),
      to: to ? createAddressFromString(to) : undefined,
      data: hexToBytes(data.startsWith("0x") ? data : `0x${data}`),
      value,
      gasLimit: 5_000_000n,
    });
    return {
      ok: !res.execResult.exceptionError,
      ret: bytesToHex(res.execResult.returnValue),
      logs: res.execResult.logs ?? [],
      created: res.createdAddress?.toString(),
    };
  };
  const deploy = async (artifact, encodedArgs = "") => {
    const res = await call(OPERATOR, undefined, `0x${artifact.evm.bytecode.object}${encodedArgs}`);
    if (!res.ok || !res.created) throw new Error(`deploy failed: ${res.ret}`);
    return res.created;
  };

  const usdcArt = arts["test/mocks/MockUSDC.sol"].MockUSDC;
  const routerArt = arts["src/SponsorshipRouter.sol"].SponsorshipRouter;
  const usdc = await deploy(usdcArt);
  const router = await deploy(routerArt, word(usdc) + word(ADMIN) + word(0n));

  const allow = await call(OPERATOR, router, encode("setAssociationAllowed(address,bool)", association, true));
  if (!allow.ok) throw new Error(`allow-list failed: ${allow.ret}`);

  await call(OPERATOR, usdc, encode("setBalance(address,uint256)", OPERATOR, amount));
  // MockUSDC setBalance may need stranger — use STRANGER pattern from tests
  const STRANGER = "0x00000000000000000000000000000000000000d4";
  await call(STRANGER, usdc, encode("setBalance(address,uint256)", OPERATOR, amount));
  await call(OPERATOR, usdc, encode("approve(address,uint256)", router, amount));

  const fiatHash = bytesToHex(keccak_256(new TextEncoder().encode(fiatPaymentRef)));
  const payout = await call(
    OPERATOR,
    router,
    encode("payoutCharityLeg(address,uint256,bytes32)", association, amount, fiatHash),
  );
  if (!payout.ok) throw new Error(`payoutCharityLeg failed: ${payout.ret}`);

  // Deterministic "tx hash" from executed logs (topics + data) + fiat ref — not a fiat stub.
  const h = createHash("sha256");
  h.update(fiatPaymentRef);
  h.update(association.toLowerCase());
  h.update(amount.toString());
  for (const log of payout.logs) {
    for (const topic of log[1]) h.update(Buffer.from(topic));
    h.update(Buffer.from(log[2]));
  }
  const settlement_tx_hash = `0x${h.digest("hex")}`;

  return {
    settlement_tx_hash,
    association: association.toLowerCase(),
    amount_micro: amount.toString(),
    router,
    usdc,
    fiat_payment_ref_hash: fiatHash,
    via_router: true,
  };
}
