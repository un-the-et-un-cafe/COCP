# Operations

## Correction reports

Correction reports are write-only from the public site. They contain only the service identifier, correction category, message, language, moderation state, and retention dates.

On Netlify, reports are stored in the `correction-reports` Blobs store. Review or export them only through the authenticated Netlify team dashboard. Do not add a public read endpoint.

The `purge-corrections` scheduled function runs daily and deletes reports whose 30-day expiry timestamp has passed. Its logs include counts only, never report contents.

Before resolving a report, verify the public fact with the named provider or an independent reviewer. Publish only the resulting listing change and its source evidence; never publish the original report text.

## Deployment

The `main` branch deploys automatically through Netlify. A release is acceptable only after the repository tests, lint, type check, Netlify production build, and production dependency audit pass.

Payment collection remains disabled until every approval listed in `requirements.md` is complete.
