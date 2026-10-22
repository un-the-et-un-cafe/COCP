# Calais Open Commons Protocol Requirements

## Purpose

Build a free, privacy focused, multilingual directory of services in Calais at first and turn it into a whole protocol that provides all tools needed for a moderated "economy within the economy". People in exile, shall have the ability doing voluntary work in exchange for compensation for expenses in the form of cryptocurrency. Sponsors have the opportunity to donate and receive packages with that, thereby supporting such an economy in addition to the productivity made by the people workforce there on a voluntary basis.

Source leads must be clearly distinguished from verified services, and the directory must remain useful without an account, wallet, payment, or tracking.

## Financial rule

The project may earn revenue from sponsors and institutional services. After refunds, taxes, payment fees, and documented operating costs, 100% of net profit must be donated to named local charities. Revenue, costs, allocations, and transfers must be reported publicly in aggregate.

## Current open work

1. Verify the imported service listings with providers and independent reviewers.
2. Complete reviewed French, English, and Arabic content.
3. Complete operational review of correction moderation. Protected review, one-way resolution, anonymous intake, and automated 30-day deletion are implemented.
4. Publish the first signed listing release after human verification. Signed releases, expiry enforcement, JSON/CSV exports, and the public change log are implemented.
5. Finish the separate sponsor journey, evidence pack, and consent operations. The aggregate public ledger, reconciliation rules, recognition-expiry gate, and zero-activity state are implemented; real records require reviewed evidence.
6. Build card and SEPA sandboxes and the tested Base sponsorship router.
7. Complete the deny-by-default Activity Idea Lab. The public planning register, multilingual concepts, risk-to-gate validator, and disabled activation/payment/badge/voucher flags are implemented; anonymous proposal intake, accountable triage, complaints, evidence review, and lawful pilot activation remain blocked.
8. Complete accessibility, privacy, security, performance, and mobile testing. Language continuity, document-language updates, right-to-left page direction, keyboard focus and skip navigation, reduced-motion support, multilingual accessibility and privacy status pages, and deployment-blocking static security, privacy, mobile-metadata, and asset-budget checks are implemented; independent review and device testing remain required and no conformity claim is made.
9. Obtain the legal, accounting, safeguarding, wallet, content, and payment approvals required before launch. The public G1–G9 readiness register and fail-closed validator are implemented with 0 of 12 gates passed; operational activation and every payment lane remain disabled until all required evidence is reviewed and unexpired.

The first production deployment is complete. ChatGPT Sites/Convex development and Netlify/Convex production are separated, the 21 source listings are synchronized with count and source-hash validation, and the directory displays a live environment-labelled database indicator.

## Rules that do not change

- Essential service information is never ranked or changed by payment.
- Beneficiaries are never profiled, advertised to, or used as referral inventory.
- No paid activity is published without lawful eligibility and operator approval.
- No project token, trading market, liquidity scheme, burn, buyback, or investment promise.
- Payments stay disabled until the responsible entity, accounts, refunds, reconciliation, and invoices are approved.

## Development after the open work

Once the current safety and launch tasks are complete, develop these revenue lines in order:

1. **Verification subscriptions** — associations, cities, and institutions pay monthly for freshness monitoring, broken-link alerts, and signed reports while public data stays free.
2. **White-label city launches** — fixed-price deployments for other cities, with local verification teams and portable open data.
3. **Managed operations and support** — annual contracts for hosting, security updates, backups, uptime monitoring, recovery testing, incident response, and export support for independent COCP deployments; public data remains open and every customer retains a tested exit path.
4. **Translation underwriting** — sponsors fund reviewed language releases and printed QR materials with a clear delivered result.
5. **Data assurance API** — paid access to signed freshness feeds, change notifications, and compliance exports; never sell personal or behavioral data.
6. **Institutional cleanup projects** — paid import, deduplication, accessibility review, and structured publication of existing public directories.
7. **Accessibility and comprehensibility assurance** — fixed-price RGAA/WCAG audits, manual assistive-technology testing, declarations, remediation backlogs, re-audits, and qualified FALC/plain-language adaptation for public-interest directories; certification claims require competent independent reviewers, and participating disabled reviewers must be paid fairly.
8. **Open service-coverage assessments** — fixed-price, reproducible reports for public bodies and foundations on service availability, freshness, geographic or category gaps, accessibility, and language coverage, using only public listings and safe aggregate statistics; no beneficiary records, inferred movements, unpublished profiling, or purchaser suppression of findings.
9. **Sponsor evidence service** — recurring evidence packs, proof pages, matching campaigns, and renewal reports using aggregate outcomes only.
10. **Training and implementation support** — paid workshops for charities and municipalities on verification, privacy, safeguarding, and running independent mirrors.
11. **Resilience and print service** — sponsored offline packs, QR cards, and emergency information refreshes for partner venues.

Published comparable-market evidence supports the three added lines: UK public-sector catalogues price managed open-source hosting and Open Referral directory support as recurring services; French and UK suppliers publish prices for accessibility audits; and French public bodies procure territorial social-needs and service-gap studies. This demonstrates an existing paid market, not guaranteed sales for COCP. Before building any line, require at least one buyer interview and either a paid pilot, signed letter of intent, or procurement route.

- Managed operations evidence: [G-Cloud managed open-source hosting](https://assets.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-14/documents/704089/153768543937957-pricing-document-2024-05-06-0953.pdf) and [Open Place Directory pricing](https://assets.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-14/documents/712497/520558693082509-pricing-document-2024-05-03-1442.pdf).
- Accessibility assurance evidence: [official RGAA audit rules](https://accessibilite.numerique.gouv.fr/obligations/evaluation-conformite/), [public-sector accessibility audit pricing](https://assets.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-13/documents/92589/493103729633349-pricing-document-2022-05-18-0819.pdf), and [French commercial RGAA audit pricing](https://www.rgaa-audit.com/faq-audit-rgaa).
- Coverage assessment evidence: [Grand Paris Seine Ouest procurement notice](https://ted.europa.eu/fr/notice/760127-2025/pdfs) and [Le Compas published territorial-analysis prices](https://mon-abs.fr/).

Each new revenue line must have a named buyer, fixed deliverable, measured cost, safeguarding review, and a public record of the resulting net-profit donation. Stop any product whose income depends on beneficiary surveillance, restricted access, unsafe work, or sponsor influence over listings.

## Specification for the next increment

This section turns the open work into buildable, testable requirements. Each item lists scope, acceptance criteria, and what stays out of scope. Nothing here relaxes the rules that do not change; where a requirement conflicts with them, the rule wins and the requirement is blocked.

### S1. Listing verification workflow (open work 1, 4)

- Each listing carries a status: `source-lead`, `provider-confirmed`, `independently-verified`, `expired`, or `withdrawn`. Only `independently-verified` listings may enter a signed release.
- Verification records store: verifier role (provider or independent reviewer), method (phone, visit, written confirmation), date, fields confirmed, and expiry (default 90 days). No personal data of beneficiaries is stored.
- Two different people must perform provider confirmation and independent verification; the validator rejects a release if one account did both.
- A listing past expiry is automatically labelled `expired` in the UI and excluded from the next release, but stays visible with a clear warning so essential information is never silently lost.
- Acceptance: a release build fails when any included listing lacks an unexpired independent verification; the public change log shows every status change with date and reason category.

### S2. Reviewed multilingual content (open work 2)

- French, English, and Arabic are release languages. A string is publishable only when translated and reviewed by a second fluent reviewer; machine translation may be used for drafts only and must be marked `draft` until reviewed.
- Missing reviewed strings fall back to French with a visible "not yet translated" notice in the user's language, never a blank.
- Arabic pages render right-to-left with mirrored layout, correct numerals choice per locale setting, and tested line breaking.
- Acceptance: a CI check reports per-language coverage and blocks a release if any essential-service field (name, address, opening hours, access conditions, contact) is unreviewed in a release language.

### S3. Correction moderation operations (open work 3)

- Define reviewer roles, a two-person rule for edits that change address, hours, or eligibility, and a target first-response time of 72 hours.
- Moderators see only the correction text and listing, never IP addresses or device data. Intake remains anonymous; the 30-day automated deletion stays in force.
- Publish a moderation policy page in all three languages, including what is rejected (personal data, accusations about individuals, advertising).
- Acceptance: a documented dry run with at least 20 synthetic corrections, measured response times, and zero retained personal data after 30 days.

### S4. Sponsor journey and evidence pack (open work 5)

- The sponsor journey lives on separate pages from the directory; no sponsor branding appears next to essential service information.
- A sponsor package states the fixed deliverable, price, recognition period, and how net profit is donated. Recognition expires automatically through the existing gate.
- Evidence packs use aggregate outcomes only, with small-number suppression (no figure below 10 is published; it shows as "fewer than 10").
- Consent records for sponsor recognition are explicit, revocable, and logged; withdrawal removes recognition within 7 days.
- Acceptance: an end-to-end test from sponsor enquiry to evidence pack using only sandbox data, with the payment step disabled.

### S5. Payment sandboxes and Base sponsorship router (open work 6)

- Card and SEPA flows run only against provider sandboxes, behind the existing disabled payment flags. Production keys must not exist in any environment until gate G-payments passes.
- The Base router accepts sponsor stablecoin contributions only, routes them to the responsible entity's approved wallet, and emits a reconciliation record per transfer. No project token, swap, liquidity, or yield functionality is permitted, and a static check fails the build if such contract calls appear.
- Every payment lane supports refunds, produces an invoice record, and reconciles against the public aggregate ledger.
- Acceptance: automated tests cover success, failure, refund, duplicate, and partial-reconciliation cases on sandbox and testnet; a contract audit is required before any mainnet deployment.

### S6. Activity Idea Lab completion (open work 7)

- Anonymous proposal intake with the same privacy guarantees as correction intake.
- Accountable triage: each proposal gets a named operator decision (accepted for review, rejected with reason category, or needs legal check) within 14 days.
- A complaints channel independent from the triage team, with a published escalation path.
- Pilot activation stays blocked until lawful eligibility, insurance, safeguarding review, and operator approval are each recorded and unexpired; the risk-to-gate validator enforces this.
- Compensation for voluntary activity is framed strictly as reimbursement of documented expenses and only within the legal limits confirmed by counsel; no wages, piecework, or badges that could imply employment.
- Acceptance: the validator rejects activation of a pilot missing any single gate, demonstrated by tests for each gate.

### S7. Quality testing (open work 8)

- Independent accessibility review against RGAA 4.1 / WCAG 2.2 AA on the main journeys, plus testing with NVDA, VoiceOver, and TalkBack.
- Device testing on at least one low-end Android phone on a throttled 3G profile; the directory home page must be usable within 5 seconds and under the existing asset budget.
- Privacy review confirming no third-party trackers, no fingerprinting, and no cookies without need.
- Security review including dependency audit, headers, and a penetration test before launch.
- Acceptance: written reports from each review, all critical findings fixed, and the public status pages updated. No conformity claim is made until an independent auditor issues one.

### S8. Launch approvals (open work 9)

- Each of the 12 gates in the G1–G9 register names an owner, the evidence required, the reviewer, and an expiry date.
- The dashboard shows gate status publicly in aggregate (passed, pending, expired), never internal documents.
- Acceptance: the fail-closed validator keeps payments and operational activation disabled while any required gate is not passed and unexpired.

### Definition of done for this increment

- All S1–S8 acceptance criteria met or explicitly marked blocked with a reason.
- Specs, tests, and public pages exist in French, English, and Arabic where user-facing.
- The requirements file's "Current open work" list is updated to reflect what was completed.
