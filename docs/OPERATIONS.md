# Operations

## Correction reports

Correction reports are write-only from the public site. They contain only the service identifier, correction category, message, language, moderation state, and retention dates.

Correction reports are stored in the `correctionReports` table in Convex. Review them only through the authenticated Convex dashboard by running the internal `corrections:listPending` query. It returns at most the 100 oldest pending reports. Do not add a public read function or endpoint.

The guarded operator command uses those same internal functions. It targets development by default and hides report messages unless they are deliberately requested:

```sh
npm run corrections:review -- list
npm run corrections:review -- list --show-messages
```

Resolve or dismiss one pending report only after checking the public fact and the privacy boundary:

```sh
npm run corrections:review -- resolve REPORT_ID --confirm-reviewed
npm run corrections:review -- dismiss REPORT_ID --confirm-reviewed
```

Production additionally requires both `--prod` and `--confirm-production`. The command first confirms that the report is still pending in the selected deployment, while the Convex mutation remains the final one-way concurrency guard.

After independently verifying the public fact, resolve or dismiss the report. Moderation is one-way: a report that has already left `pending` cannot be changed again. Apply any verified listing update separately so it still passes the publication and provenance gates.

The Convex cron runs daily and deletes reports whose 30-day expiry timestamp has passed. Its logs include deletion counts only, never report contents.

Netlify sends validated reports to a protected Convex HTTP action. The same secret `CORRECTION_API_TOKEN` must be stored in the production environments of both services, and `CONVEX_SITE_URL` must be set on Netlify. Rotate the token if it is ever disclosed.

Keep the Convex team on the Free plan. Do not upgrade it or enable usage-based billing without explicit approval.

Before resolving a report, verify the public fact with the named provider or an independent reviewer. Publish only the resulting listing change and its source evidence; never publish the original report text.

## Environments and deployment

The owner-only ChatGPT Sites deployment is the development/staging surface. Its build uses the personal development Convex deployment configured in ignored `web/.env.local` values. The directory badge must say “Development database synced”; it must never imply that this data is production.

Netlify is the production surface. Only `[context.production]` runs `npm run deploy:netlify`, which deploys the Convex schema and functions, atomically replaces the production `serviceListings` table, records the sync receipt, and then builds the site. Deploy Previews and branch deploys build the frontend without touching production Convex.

Configure these values in Netlify for the **Production** deploy context only:

- `CONVEX_DEPLOY_KEY`: production deploy key with deployment permission.
- `CONVEX_SITE_URL`: production `*.convex.site` URL used by the correction function.
- `VITE_CONVEX_SITE_URL`: the same production site URL, exposed to the browser only for the read-only sync-status endpoint.
- `CORRECTION_API_TOKEN`: production-only secret, with the same value configured in production Convex.

Do not commit any of those values. Netlify’s production context must target the repository’s production branch. A normal production push then deploys both Convex and the frontend; manual production sync remains available through `npm run sync:listings:prod` for recovery.

## Listing database sync

The versioned JSON file remains the portable source of record. Convex stores a queryable copy plus a sync receipt containing its content hash, row count, environment, and timestamp. The directory reads `/directory-status` only for the sync indicator; it continues to show the bundled source data if Convex is unavailable.

Sync the configured development deployment:

```bash
npm run sync:listings:dev
```

This deploys the development schema and functions, atomically replaces the `serviceListings` table with all source entries, validates unique IDs and row count, and records the receipt. Production sync is normally owned by Netlify’s production pipeline. Confirm the target deployment and backup policy before any manual production recovery.

A release is acceptable only after the repository tests, lint, type check, Netlify production build, database sync receipt, and production dependency audit pass.

Payment collection remains disabled until every approval listed in `requirements.md` is complete.

## Signed listing releases

Keep the Ed25519 private release key outside this repository. The matching public key may be committed with a release. Before publishing, confirm that every selected row has `publishable: true`, a `verified` status, a named review owner, and valid `checked_at` and `expires_at` timestamps.

Create a release from the repository root with:

```sh
npm run release:listings -- --released-at 2026-09-15T12:00:00Z --key-id release-2026 --private-key /secure/path/release-private.pem --public-key /secure/path/release-public.pem
```

The command refuses empty releases, expired listings, incomplete verification, and mismatched keys. It updates the release-controlled directory data, JSON and CSV exports, signed release files, public key, and change history. Review and commit all generated public files together.

Anyone can verify a downloaded release with:

```sh
npm run verify:release -- release.json signature.json public-key.pem
```

Stop publication immediately when the current time reaches the earliest `expires_at` in a release. Verify and republish affected listings rather than extending dates without a fresh review.

## Listing QA (v0.1.1)

Generate an aggregate QA report (no personal data) from Appendix A candidates:

```sh
npm run qa:listings
```

The report is written to `web/data/qa-report.json`. The command exits non-zero if any `publishable: true` row lacks `verified` + `checked_at` + `expires_at` + review owner. Root `npm run validate:data` and `npm run build` include this check.

## Feature flags (fail-closed)

`web/data/feature-flags.json` controls experimental surfaces. Any `payments_*` or `activity_payments` flag set to `true` while launch gates are incomplete **fails the build**. Keep `payments_base_mainnet` false. Model B production conversion (EUR→USDC) requires an authorised CASP and human gates — never enable payment flags in this slice without Jakob + ethics review.

## Model B settlement rehearsal (testnet / synthetic only)

```sh
npm run rehearse:settlement
```

Writes `web/data/settlement-rehearsal.draft.json` with synthetic TradFi ref + USDC 90% leg fields. Does not deploy contracts or open payment lanes. Mainnet requires G9 + Jakob explicit confirm.

Contract compile + tests (local solcjs + in-process EVM; no RPC, no keys): `npm run test:contracts`. See `contracts/README.md`. No Base Sepolia deploy without Jakob's explicit OK and a dedicated testnet-only key.

## Sponsor evidence + print QR

```sh
npm run generate:sponsor-evidence
PUBLIC_SITE_URL=https://your.production.origin npm run generate:qr-pack
```

Outputs under `web/public/evidence/` and `web/public/print/`.

Print QR details:

- Real ISO/IEC 18004 QR (byte mode, ECC M, 4-module quiet zone) via the vendored MIT `scripts/vendor/qrcode-generator.mjs` (provenance + sha256 in `scripts/vendor/README.md`). No runtime dependency.
- Payload is exactly `PUBLIC_SITE_URL` + `/#emergency`. The generator rejects non-https origins, paths, query strings and tracking parameters, so scans cannot be attributed to a card, venue or person.
- Outputs: `calais-services.a6.html`, `calais-services.a5.html` (print cards with inline SVG), `calais-services.qr.svg` (standalone vector for designers), `*.url.txt` (decode target).
- While the origin is a placeholder (`*.example.org`), cards carry a red **DRAFT** banner. Regenerate with the real production origin before printing.
- Decode check (optional, independent reader): `npm i --no-save jsqr@1 @resvg/resvg-js@2 && npm run verify:qr`.
- The Arabic line on the card is pending human G4 language review before any print run.

## Empty publishable set

`npm run release:listings` refuses an empty signed release (`Refusing to create an empty signed release.`). `web/data/published-listings.json` is intentionally `[]` until a verified release exists; the directory UI continues to show unverified guide leads with confirmation warnings.

## Model B sandbox (v0.2)

- Feature flags live in `web/data/feature-flags.json` (version 2). Production `payments_card` / `payments_sepa` / `payments_base_mainnet` / `activity_payments` stay **false** while launch gates are blocked.
- Sandbox UI flags (`payments_card_testmode_ui`, `payments_sepa_testmode_ui`, `payout_queue_sandbox`, …) may be enabled only on noindex sponsor/operator routes with **test** Stripe keys (`pk_test_` / `sk_test_`). Live keys fail validation.
- Refund window defaults: 14 days card / 14 days SEPA (`web/data/settlement-config.json`). **Counsel note:** chargebacks can arrive after the window — production must not auto-payout until counsel signs the risk policy.
- Association wallets: `web/data/association-wallet-registry.sandbox.json` (fictional only). Operator page `/readiness/association-wallets`. Never expose wallets on beneficiary routes.
- Payout: `npm run payout:batch` (dry-run). `TestnetDirectProvider` for sandbox; `CaspProvider` throws `CASP_NOT_CONFIGURED` until a real authorised CASP adapter is registered. No DIY EUR→USDC.
- Reconciliation: `npm run generate:reconciliation`. CI fails on mismatch fixture.
- Base Sepolia deploy: `contracts/scripts/deploy-testnet.mjs` refuses without `--testnet --confirm` + `BASE_SEPOLIA_DEPLOY_KEY`. Needs Jakob OK.
- Ethics review by Whitey before any PR that flips a **production** payment flag.
