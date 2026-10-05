# Demo notes — Spec-Build v0.1.1 (Model B)

1. **QA report:** `npm run qa:listings` → open `web/data/qa-report.json` or `/readiness/listings-qa`.
2. **Evidence pack:** `npm run generate:sponsor-evidence` → open `/sponsors/evidence-pack.synthetic.fr.html` (TradFi receipt + settlement tx hash).
3. **Settlement rehearsal:** `npm run rehearse:settlement` → `web/data/settlement-rehearsal.draft.json` (synthetic fiat ref + testnet USDC 90% fields). No live chain required for the stub hash.
4. **Sandbox copy:** `/sponsors/sandbox` — production sponsors pay card/SEPA; sandbox shows crypto settlement leg only.
5. **Print QR:** `PUBLIC_SITE_URL=https://… npm run generate:qr-pack` → `web/public/print/`.
6. **Payments:** all `payments_*` flags and `payment_lanes` remain false; launch-gates 0/12.
