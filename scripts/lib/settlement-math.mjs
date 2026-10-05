/** Model B: 90% charity (crypto settlement leg), 10% admin (may stay EUR). feeBps ≤ 1000. */
export const MAX_FEE_BPS = 1000;
export const CHARITY_BPS = 9000;
export const ADMIN_BPS = 1000;
export const BPS_DENOM = 10_000;

export function assertFeeCap(feeBps) {
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > MAX_FEE_BPS) {
    throw new Error(`feeBps must be an integer 0..${MAX_FEE_BPS}`);
  }
}

/** Split EUR cents into charity (90%) and admin (10%). */
export function splitEurCents(eurCents, charityBps = CHARITY_BPS) {
  if (!Number.isSafeInteger(eurCents) || eurCents <= 0) throw new Error("eurCents must be a positive integer");
  if (charityBps < BPS_DENOM - MAX_FEE_BPS || charityBps > BPS_DENOM)
    throw new Error("charityBps out of allowed range for Model B");
  const charity = Math.floor((eurCents * charityBps) / BPS_DENOM);
  const admin = eurCents - charity;
  return { charity_eur_cents: charity, admin_eur_cents: admin, charity_bps: charityBps, admin_bps: BPS_DENOM - charityBps };
}

/**
 * Sandbox stub: 1 EUR = 1 USDC (6 decimals). Production conversion requires authorised CASP —
 * never DIY custody/exchange in app code.
 */
export function eurCentsToUsdcMicro(eurCents, { rateMicroPerCent = 10_000 } = {}) {
  // rateMicroPerCent default: 1 cent -> 10_000 micro = 0.01 USDC => 1:1
  if (!Number.isSafeInteger(eurCents) || eurCents < 0) throw new Error("invalid eurCents");
  return eurCents * rateMicroPerCent;
}

export function assertBeneficiaryNotAdmin(beneficiary, admin) {
  if (!beneficiary || !admin) throw new Error("beneficiary and admin required");
  if (beneficiary.toLowerCase() === admin.toLowerCase()) {
    throw new Error("beneficiary must not equal admin");
  }
}
