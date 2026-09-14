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

The `main` branch deploys automatically through Netlify. A release is acceptable only after the repository tests, lint, type check, Netlify production build, and production dependency audit pass.

Payment collection remains disabled until every approval listed in `requirements.md` is complete.
