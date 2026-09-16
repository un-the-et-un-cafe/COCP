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
npm run build
```

The build validates listing provenance and publication gates, runs boundary tests, and builds the static frontend.

Netlify additionally runs `npm run audit:web` after prerendering. The audit fails deployment if a public route is missing mobile metadata or basic document structure, if third-party executable or embedded content appears, if a client artifact contains a protected credential name or tracking signature, if new-tab links omit referrer protection, if required response-header configuration disappears, or if the static asset budgets are exceeded.

## Human gates still required

Public launch and payments remain blocked until the owners and evidence for gates G1 through G9 in the requirements document are recorded. Never commit private keys, identity documents, payment credentials, personal bank details, or beneficiary case data.
