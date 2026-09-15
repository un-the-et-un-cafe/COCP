# Operations

## Correction reports

Correction reports are write-only from the public site. They contain only the service identifier, correction category, message, language, moderation state, and retention dates.

Correction reports are stored in the `correctionReports` table in Convex. Review them only through the authenticated Convex dashboard by running the internal `corrections:listPending` query. It returns at most the 100 oldest pending reports. Do not add a public read function or endpoint.

After independently verifying the public fact, run the internal `corrections:moderate` mutation with the report ID and an outcome of `resolved` or `dismissed`. Moderation is one-way: a report that has already left `pending` cannot be changed again. Apply any verified listing update separately so it still passes the publication and provenance gates.

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
