// In-process EVM tests for SponsorshipRouter (Model B testnet rehearsal helper).
// No network, no RPC, no keys: solcjs compiles, @ethereumjs/evm executes.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { createEVM } from "@ethereumjs/evm";
import { Common, Hardfork, Mainnet } from "@ethereumjs/common";
import { createAddressFromString, bytesToHex, hexToBytes } from "@ethereumjs/util";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { compile } from "../scripts/compile.mjs";

const OPERATOR = "0x00000000000000000000000000000000000000a1";
const ASSOCIATION = "0x00000000000000000000000000000000000000b2";
const ADMIN = "0x00000000000000000000000000000000000000c3";
const STRANGER = "0x00000000000000000000000000000000000000d4";
const ZERO = "0x0000000000000000000000000000000000000000";
const USDC = (n) => BigInt(Math.round(n * 1_000_000));
const FIAT_REF_HASH = bytesToHex(keccak_256(new TextEncoder().encode("SYNTH-STRIPE-pi_000001")));

let artifacts;
before(async () => {
  artifacts = (await compile()).contracts;
});

const selector = (sig) => bytesToHex(keccak_256(new TextEncoder().encode(sig)).slice(0, 4));
const word = (v) => {
  if (typeof v === "boolean") v = v ? 1n : 0n;
  if (typeof v === "string") v = BigInt(v);
  return v.toString(16).padStart(64, "0");
};
const encode = (sig, ...args) => selector(sig) + args.map(word).join("");

async function setup({ feeBps = 0 } = {}) {
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
    return res;
  };
  const usdcArt = artifacts["test/mocks/MockUSDC.sol"].MockUSDC;
  const routerArt = artifacts["src/SponsorshipRouter.sol"].SponsorshipRouter;
  const usdc = (await deploy(usdcArt)).created;
  const routerRes = await deploy(routerArt, word(usdc) + word(ADMIN) + word(BigInt(feeBps)));
  const router = routerRes.created;
  const balanceOf = async (who) => BigInt((await call(STRANGER, usdc, encode("balanceOf(address)", who))).ret);
  return { evm, call, deploy, usdc, router, routerRes, routerArt, balanceOf };
}

const FORBIDDEN_OPCODES = { 0xf0: "CREATE", 0xf2: "CALLCODE", 0xf4: "DELEGATECALL", 0xf5: "CREATE2", 0xff: "SELFDESTRUCT" };

/** Opcodes in the executable part of runtime bytecode: strips the trailing CBOR metadata
 *  (length in the last 2 bytes) and skips PUSH immediates, so hash bytes cannot false-positive. */
function executableOpcodes(hex) {
  const code = hexToBytes(`0x${hex}`);
  const metaLen = (code[code.length - 2] << 8) | code[code.length - 1];
  const end = code.length - metaLen - 2;
  const ops = new Set();
  for (let i = 0; i < end; i++) {
    const op = code[i];
    ops.add(op);
    if (op >= 0x60 && op <= 0x7f) i += op - 0x5f;
  }
  return ops;
}

const revertSelector = (res) => res.ret.slice(0, 10);

test("compiles with zero warnings and runtime has no DELEGATECALL/SELFDESTRUCT/CALLCODE", () => {
  const art = artifacts["src/SponsorshipRouter.sol"].SponsorshipRouter;
  const found = executableOpcodes(art.evm.deployedBytecode.object);
  for (const [op, name] of Object.entries(FORBIDDEN_OPCODES)) assert.equal(found.has(Number(op)), false, `runtime contains ${name}`);
  const fns = Object.keys(art.evm.methodIdentifiers).sort();
  assert.deepEqual(fns, [
    "adminWallet()",
    "feeBps()",
    "paymentToken()",
    "payoutCharityLeg(address,uint256,bytes32)",
    "settleWithOnChainFee(address,uint256)",
  ]);
});

test("constructor rejects zero addresses and feeBps > 1000; accepts 1000", async () => {
  const { deploy, routerArt, usdc } = await setup();
  const bad = [
    [ZERO, ADMIN, 0n, "ZeroAddress()"],
    [usdc, ZERO, 0n, "ZeroAddress()"],
    [usdc, ADMIN, 1001n, "FeeTooHigh()"],
  ];
  for (const [token, admin, fee, err] of bad) {
    const res = await deploy(routerArt, word(token) + word(admin) + word(fee));
    assert.equal(res.ok, false, err);
    assert.equal(revertSelector(res), selector(err));
  }
  assert.equal((await deploy(routerArt, word(usdc) + word(ADMIN) + word(1000n))).ok, true);
});

test("immutables are readable", async () => {
  const { call, router, usdc } = await setup({ feeBps: 1000 });
  assert.equal(BigInt((await call(STRANGER, router, encode("paymentToken()"))).ret), BigInt(usdc));
  assert.equal(BigInt((await call(STRANGER, router, encode("adminWallet()"))).ret), BigInt(ADMIN));
  assert.equal(BigInt((await call(STRANGER, router, encode("feeBps()"))).ret), 1000n);
});

test("payoutCharityLeg moves exactly the 90% leg operator -> association and emits fiat ref hash", async () => {
  const { call, usdc, router, balanceOf } = await setup();
  const amount = USDC(71.1); // 90% of a synthetic EUR 79.00 sponsorship
  await call(STRANGER, usdc, encode("setBalance(address,uint256)", OPERATOR, amount));
  await call(OPERATOR, usdc, encode("approve(address,uint256)", router, amount));
  const res = await call(OPERATOR, router, encode("payoutCharityLeg(address,uint256,bytes32)", ASSOCIATION, amount, FIAT_REF_HASH));
  assert.equal(res.ok, true);
  assert.equal(await balanceOf(ASSOCIATION), amount);
  assert.equal(await balanceOf(OPERATOR), 0n);
  assert.equal(await balanceOf(router), 0n, "router never custodies funds on Model B path");
  assert.equal(await balanceOf(ADMIN), 0n, "admin 10% stays EUR off-chain");
  const topic0 = bytesToHex(keccak_256(new TextEncoder().encode("CharityPayout(address,address,uint256,bytes32)")));
  const log = res.logs.find((l) => bytesToHex(l[1][0]) === topic0);
  assert.ok(log, "CharityPayout emitted");
  assert.equal(BigInt(bytesToHex(log[1][1])), BigInt(OPERATOR));
  assert.equal(BigInt(bytesToHex(log[1][2])), BigInt(ASSOCIATION));
  assert.equal(bytesToHex(log[1][3]), FIAT_REF_HASH);
  assert.equal(BigInt(bytesToHex(log[2])), amount);
});

test("payoutCharityLeg guards: zero association, association == admin, zero amount", async () => {
  const { call, router } = await setup();
  const cases = [
    [ZERO, 1n, "ZeroAddress()"],
    [ADMIN, 1n, "BeneficiaryIsAdmin()"],
    [ASSOCIATION, 0n, "ZeroAmount()"],
  ];
  for (const [to, amt, err] of cases) {
    const res = await call(OPERATOR, router, encode("payoutCharityLeg(address,uint256,bytes32)", to, amt, FIAT_REF_HASH));
    assert.equal(res.ok, false, err);
    assert.equal(revertSelector(res), selector(err));
  }
});

test("payoutCharityLeg reverts without allowance and with a false-returning token", async () => {
  const { call, usdc, router, balanceOf } = await setup();
  await call(STRANGER, usdc, encode("setBalance(address,uint256)", OPERATOR, USDC(10)));
  const noAllowance = await call(OPERATOR, router, encode("payoutCharityLeg(address,uint256,bytes32)", ASSOCIATION, USDC(10), FIAT_REF_HASH));
  assert.equal(noAllowance.ok, false);
  await call(OPERATOR, usdc, encode("approve(address,uint256)", router, USDC(10)));
  await call(STRANGER, usdc, encode("setFailMode(bool)", true));
  const falseRet = await call(OPERATOR, router, encode("payoutCharityLeg(address,uint256,bytes32)", ASSOCIATION, USDC(10), FIAT_REF_HASH));
  assert.equal(falseRet.ok, false);
  assert.equal(revertSelector(falseRet), selector("TransferFailed()"));
  assert.equal(await balanceOf(ASSOCIATION), 0n);
});

test("settleWithOnChainFee splits 90/10 at feeBps=1000 and leaves router empty", async () => {
  const { call, usdc, router, balanceOf } = await setup({ feeBps: 1000 });
  const amount = USDC(100);
  await call(STRANGER, usdc, encode("setBalance(address,uint256)", OPERATOR, amount));
  await call(OPERATOR, usdc, encode("approve(address,uint256)", router, amount));
  const res = await call(OPERATOR, router, encode("settleWithOnChainFee(address,uint256)", ASSOCIATION, amount));
  assert.equal(res.ok, true);
  assert.equal(await balanceOf(ASSOCIATION), USDC(90));
  assert.equal(await balanceOf(ADMIN), USDC(10));
  assert.equal(await balanceOf(router), 0n);
});

test("settleWithOnChainFee rounds fee down (association never short-changed) and skips admin at feeBps=0", async () => {
  const tiny = await setup({ feeBps: 1000 });
  await tiny.call(STRANGER, tiny.usdc, encode("setBalance(address,uint256)", OPERATOR, 7n));
  await tiny.call(OPERATOR, tiny.usdc, encode("approve(address,uint256)", tiny.router, 7n));
  assert.equal((await tiny.call(OPERATOR, tiny.router, encode("settleWithOnChainFee(address,uint256)", ASSOCIATION, 7n))).ok, true);
  assert.equal(await tiny.balanceOf(ASSOCIATION), 7n);
  assert.equal(await tiny.balanceOf(ADMIN), 0n);

  const nofee = await setup({ feeBps: 0 });
  await nofee.call(STRANGER, nofee.usdc, encode("setBalance(address,uint256)", OPERATOR, USDC(5)));
  await nofee.call(OPERATOR, nofee.usdc, encode("approve(address,uint256)", nofee.router, USDC(5)));
  const res = await nofee.call(OPERATOR, nofee.router, encode("settleWithOnChainFee(address,uint256)", ASSOCIATION, USDC(5)));
  assert.equal(res.ok, true);
  assert.equal(await nofee.balanceOf(ASSOCIATION), USDC(5));
  assert.equal(await nofee.balanceOf(ADMIN), 0n);
});

test("settleWithOnChainFee guards mirror payoutCharityLeg", async () => {
  const { call, router } = await setup({ feeBps: 1000 });
  for (const [to, amt, err] of [
    [ZERO, 1n, "ZeroAddress()"],
    [ADMIN, 1n, "BeneficiaryIsAdmin()"],
    [ASSOCIATION, 0n, "ZeroAmount()"],
  ]) {
    const res = await call(OPERATOR, router, encode("settleWithOnChainFee(address,uint256)", to, amt));
    assert.equal(revertSelector(res), selector(err), err);
  }
});

test("router rejects native ETH (no payable, no receive/fallback)", async () => {
  const { call, router } = await setup();
  const res = await call(OPERATOR, router, "0x", 1n);
  assert.equal(res.ok, false);
});
