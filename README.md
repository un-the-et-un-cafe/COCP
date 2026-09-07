# Calais Open Commons Protocol

Privacy-first, multilingual service information for Calais, with sponsorship and activity features isolated behind legal, safeguarding, payment, and verification gates.

The master source of truth is `Calais_Open_Commons_Protocol_Master_Requirements.docx`. The short active backlog and post-launch revenue roadmap are maintained in `requirements.md`. This repository currently implements an emergency-first directory, French/English/Arabic interface scaffolds, an unverified Appendix A transcription, a separate disabled-by-default sponsorship surface, a privacy-limited anonymous correction queue, data validation, and prohibited-feature tests.

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

## Human gates still required

Public launch and payments remain blocked until the owners and evidence for gates G1 through G9 in the requirements document are recorded. Never commit private keys, identity documents, payment credentials, personal bank details, or beneficiary case data.
