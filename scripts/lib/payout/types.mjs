/**
 * @typedef {object} PayoutBatch
 * @property {string} batch_id
 * @property {string} association_id
 * @property {string} association_label
 * @property {string} wallet_address — operator-only; never publish on beneficiary routes
 * @property {number} charity_eur_cents_total
 * @property {number} usdc_amount_micro
 * @property {string[]} fiat_payment_refs
 * @property {string} approver_a
 * @property {string} approver_b
 * @property {string} approved_at
 * @property {string} approval_statement
 */

/**
 * @typedef {object} PayoutResult
 * @property {string} settlement_tx_hash
 * @property {"testnet_direct"|"casp"} provider_id
 * @property {boolean} synthetic
 */
