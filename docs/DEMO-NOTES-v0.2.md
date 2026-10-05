# COCP Demo notes — Spec-Build v0.2 (Model B sandbox)

**Branch:** `browney/v0.2-wp0-g-k`  
**Payments:** production lanes **false**; launch gates **0/12 blocked**.  
**Skipped for Jakob:** H-1 sponsor copy / founder_housing_support; Base Sepolia real deploy.

## Demo path (sandbox)

1. **Test card / SEPA (flags off by default):** `/sponsors/sandbox` shows a documentary Test checkout panel. Flip `payments_card_testmode_ui` / `payments_sepa_testmode_ui` only in a non-indexed preview with `pk_test_` / `sk_test_` env — never live keys.
2. **Refund window:** paid → holding → cleared after `settlement-config.json` days (default 14 card / SEPA). Counsel note: late chargebacks vs auto-payout.
3. **Payout batch:** `npm run payout:batch` (dry-run) then `npm run payout:batch:execute` when `payout_queue_sandbox` true — two-person approval, TestnetDirectProvider mock hash, CaspProvider throws if selected unconfigured.
4. **Reconciliation:** `npm run generate:reconciliation` → `web/data/reconciliation/YYYY-MM.sandbox.json`; mismatch fixture fails CI.
5. **Day-rhythm:** directory categories include orientation / language_tandem / … — information only, no booking.

## Hard bans unchanged

No project token, no beneficiary wallets on public routes, no crypto wages without work rights, no profiling, no association outreach, no mainnet.
