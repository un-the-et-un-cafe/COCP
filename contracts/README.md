# contracts/ — Model B SponsorshipRouter (testnet rehearsal only)

`src/SponsorshipRouter.sol` is an operator-side helper: after a sponsor's **card/SEPA EUR** payment
clears (and the refund window closes), the operator sends the USDC equivalent of the **90% charity leg**
to the verified association wallet and the contract emits `CharityPayout` with a hash of the fiat
payment reference. It is **not** a sponsor checkout, holds no funds on the Model B path, has no mint,
no pause, no upgrade, no `delegatecall`, and rejects native ETH.

Hard limits (Vision v1.1 §2): no project token, no beneficiary/refugee wallets, no payments to people,
no mainnet. `payment_lanes` and `payments_*` flags stay `false`; launch gates stay 0/12.

## Compile + test (CI-friendly, no network RPC, no keys)

```sh
npm --prefix contracts ci
npm --prefix contracts run build   # solcjs 0.8.37, evmVersion=cancun, fails on any warning; artifacts -> contracts/out/ (gitignored)
npm --prefix contracts test        # in-process EVM (@ethereumjs/evm) against test/mocks/MockUSDC.sol
# or from the repo root:
npm run test:contracts
```

The tests cover constructor guards (zero address, `feeBps > 1000`), immutables, the Model B
`payoutCharityLeg` happy path (exact 90% leg to association, router and admin untouched, event topics
incl. fiat ref hash), guard reverts (zero association, association == admin, zero amount, missing
allowance, false-returning token), the optional on-chain 90/10 path (split, fee rounds down, `feeBps=0`),
native ETH rejection, the exact public function surface, and a runtime-bytecode scan for
`CREATE`/`CREATE2`/`CALLCODE`/`DELEGATECALL`/`SELFDESTRUCT`.

`test/mocks/MockUSDC.sol` is a test-only USDC stand-in (balances set by the harness). It is never deployed.

## Optional: Foundry

`foundry.toml` is provided so Foundry users can run `forge build` from `contracts/`. Foundry is not
required by CI. If you want it locally, install it the way your org approves (e.g. a pinned release
binary from https://github.com/foundry-rs/foundry/releases), then:

```sh
cd contracts && forge build
```

## Deployment

**Not deployed anywhere.** `web/data/base-deployment.testnet.json` holds placeholders. A Base Sepolia
deploy needs Jakob's explicit OK, a dedicated testnet-only key and faucet funds, and must never reuse a
mainnet key. Mainnet additionally requires launch gate G9 + Jakob's explicit confirmation and an
authorised CASP for EUR→USDC.
