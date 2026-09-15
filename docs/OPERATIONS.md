# Operations

## Correction reports

Correction reports are write-only from the public site. They contain only the service identifier, correction category, message, language, moderation state, and retention dates.

Correction reports are stored in the `correctionReports` table in Convex. Review them only through the authenticated Convex dashboard by running the internal `corrections:listPending` query. It returns at most the 100 oldest pending reports. Do not add a public read function or endpoint.

After independently verifying the public fact, run the internal `corrections:moderate` mutation with the report ID and an outcome of `resolved` or `dismissed`. Moderation is one-way: a report that has already left `pending` cannot be changed again. Apply any verified listing update separately so it still passes the publication and provenance gates.

The Convex cron runs daily and deletes reports whose 30-day expiry timestamp has passed. Its logs include deletion counts only, never report contents.

Netlify sends validated reports to a protected Convex HTTP action. The same secret `CORRECTION_API_TOKEN` must be stored in the production environments of both services, and `CONVEX_SITE_URL` must be set on Netlify. Rotate the token if it is ever disclosed.

Keep the Convex team on the Free plan. Do not upgrade it or enable usage-based billing without explicit approval.

Before resolving a report, verify the public fact with the named provider or an independent reviewer. Publish only the resulting listing change and its source evidence; never publish the original report text.

## Deployment

Deploy the Convex production functions with `npm --prefix web run convex:deploy` before releasing a site version that changes the correction schema or functions. Store the production deployment's site URL as `CONVEX_SITE_URL` on Netlify, and use a production-only `CORRECTION_API_TOKEN` with the same value in both services.

The `main` branch deploys automatically through Netlify. Netlify builds the site but does not deploy Convex, so its build does not require a long-lived Convex deploy key. A release is acceptable only after the repository tests, lint, type check, Netlify production build, and production dependency audit pass.

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
