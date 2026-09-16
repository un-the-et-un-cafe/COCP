# Calais Open Commons Protocol

Privacy-first, multilingual service information for Calais, with sponsorship and activity features isolated behind legal, safeguarding, payment, and verification gates.

The master source of truth is `Calais_Open_Commons_Protocol_Master_Requirements.docx`. The short active backlog and post-launch revenue roadmap are maintained in `requirements.md`. This repository currently implements an emergency-first directory, persistent French/English/Arabic navigation across every public route, an unverified Appendix A transcription, a separate disabled-by-default sponsorship surface with an aggregate public ledger, a privacy-limited anonymous correction queue, a deny-by-default Activity Idea Lab planning register, a public fail-closed launch-readiness register, multilingual accessibility and privacy status pages, data validation, and prohibited-feature tests.

## Current safety posture

- Every imported service is `unverified` and `publishable: false`.
- The public directory has no account, analytics, wallet SDK, checkout, sponsor attribution, or geolocation request.
- No payment lane is enabled.
- No activity provider or paid activity can be published.
- No project token, exchange, liquidity, burn, buyback, price oracle, or traded-token redemption code is permitted.

## Run locally

Use Node 22.13 or newer.

```sh
npm --prefix web install
npm --prefix web run dev
```

## Validate

```sh
npm ci
npm ci --prefix web
npm run ci
```

This is the same gate used by GitHub Actions. It validates listing provenance and publication gates, runs boundary tests, lints and type-checks the frontend, builds every static route, and audits the generated site.

Netlify additionally runs `npm run audit:web` after prerendering. The audit fails deployment if a public route is missing mobile metadata or basic document structure, if third-party executable or embedded content appears, if a client artifact contains a protected credential name or tracking signature, if new-tab links omit referrer protection, if required response-header configuration disappears, or if the static asset budgets are exceeded.

## CI/CD

Development follows a protected, trunk-based flow:

1. Create a branch and open a pull request to `main`.
2. GitHub Actions runs `npm run ci`; Netlify builds a Deploy Preview without access to production Convex credentials.
3. Review the checks and preview, then approve and merge the pull request.
4. Netlify automatically deploys the exact merged commit from `main`. Only this production context may deploy and synchronize production Convex.

The owner-only ChatGPT Sites deployment is an optional development sandbox. It is not a production promotion mechanism or a substitute for the pull-request checks. Repository administrators must protect `main`, require the `Validate` check and an approving review, and disallow direct and force pushes. See `docs/OPERATIONS.md` for the one-time settings and recovery procedure.

## Human gates still required

Public launch and payments remain blocked until the owners and evidence for gates G1 through G9 in the requirements document are recorded. Never commit private keys, identity documents, payment credentials, personal bank details, or beneficiary case data.
