# Threat Model

## Scope

This model covers the public service directory and the repository’s current prototype state. Sponsor payments, activity operations, moderation services, attestations, and deployment infrastructure remain disabled until separately implemented and reviewed.

## Protected interests

- Safety and anonymity of people seeking services.
- Accuracy and freshness of emergency, health, accommodation, food, and water information.
- Independence of listings from sponsor influence.
- Integrity of future payment allocations and public reconciliation.
- Confidentiality of administrator, operator, and provider credentials.
- Reproducibility and portability of the public dataset.

## Trust boundaries

The browser may display only public, reviewed listing releases. Source documents and transcriptions are evidence, not verification. Provider, verifier, and translator attestations are distinct trust roles. Sponsor and payment code must stay outside beneficiary-facing bundles. Any future form endpoint is an untrusted input boundary. External map, telephone, and messaging links leave the application.

## Primary threats and controls

| Threat | Consequence | Current control | Required before launch |
| --- | --- | --- | --- |
| Stale or false listing | A person misses essential help or travels unnecessarily | Imported rows remain outside the public dataset; release tooling rejects expired or incomplete publication claims | Provider confirmation and required verifier threshold |
| Sensitive data submitted or logged | Exposure, profiling, or retaliation | No accounts; correction intake is field-limited, size-bounded, write-only, and warns against personal data | Moderation procedure, incident route, and periodic retention checks |
| Sponsor affects service order | Essential information becomes advertising | No sponsor code exists in the directory route; boundary test scans it | Separate sponsor application and automated rank-independence tests |
| Wallet or checkout loads on public route | Tracking, confusion, or coercion | No wallet or payment dependency in the frontend | Separate sponsor route and bundle inspection |
| Unsafe or unauthorized work offer | Exploitation or unlawful employment | Activity features are absent and deny-by-default | Operator attestation, work eligibility, contract or invoice, sector and complaint gates |
| Forged verification | Untrusted content appears reliable | Ed25519-signed, content-addressed releases, a pinned public key per release, and a public change log | Role separation and threshold policy |
| Malicious correction content | Stored script, doxxing, or spam | Correction input strips control characters, rejects a honeypot field, is capped at 800 characters, is visible only in the authenticated dashboard, and the Netlify intake is rate-limited per IP and domain | Moderation procedure, abuse monitoring, and retention checks |
| Payment replay or reversal error | Duplicate recognition or incorrect allocation | Payments are disabled | Signed timestamped webhooks, idempotency, settlement state and exact reversal ledger |
| Wrong immutable wallet or token | Irrecoverable fund loss | No deployment manifest or live contract | Checksum, ownership proof, two-person review, testnet rehearsal and explicit mainnet confirmation |
| Speculative token code enters repository | Legal, financial, and exploitation risk | Prohibited-feature test scans source and dependencies | Independent review and continuing CI enforcement |

## Data minimization decisions

The application must not collect or infer immigration status, nationality, live location, case history, precise camp location, beneficiary referral attribution, earnings, or identity documents. Language preference is device-local. Public metrics must remain aggregate. External links are explicit and maps are never embedded.

## Stop conditions

Stop publication if a critical listing lacks its required signatures, personal case data enters a public file or log, sponsor influence reaches listing presentation, a wallet library enters a beneficiary route, an activity lacks an unexpired operator attestation, or prohibited token-market code is introduced. Stop payment activation if the accountable entity, invoice treatment, payment account, immutable addresses, reconciliation, refund controls, or independent contract review is missing.
