import type { Locale } from './use-locale';

/** "USDC on Base" chip + proof-of-payout link. Sponsor/transparency pages only — never on
 *  emergency or help listings. No real transfers exist yet (sandbox, unfunded testnet), so
 *  the proof link points to the public ledger / synthetic evidence, labelled as a sandbox
 *  example. Never put a tx hash or address here unless it comes from a real ledger row. */
const labels: Record<Locale, { chip: string; how: string; proof: string; sandbox: string }> = {
  fr: { chip: 'USDC sur Base', how: 'Les 90 % parviennent aux associations vérifiées en USDC sur Base.', proof: 'Preuve de versement', sandbox: 'exemple / sandbox' },
  en: { chip: 'USDC on Base', how: 'The 90% reaches verified associations as USDC on Base.', proof: 'Proof of payout', sandbox: 'example / sandbox' },
  ar: { chip: 'USDC على Base', how: 'تصل نسبة 90٪ إلى الجمعيات الموثّقة كـ USDC على Base.', proof: 'إثبات الدفع', sandbox: 'مثال / بيئة تجريبية' },
};

export function UsdcProof({ locale, proofHref }: { locale: Locale; proofHref: string }) {
  const t = labels[locale];
  return (
    <p className="usdc-proof">
      <span className="chain-chip">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4v8M5.5 6.5c0-1 1.1-1.6 2.5-1.6s2.5.6 2.5 1.6S9.4 8 8 8s-2.5.6-2.5 1.6 1.1 1.6 2.5 1.6 2.5-.6 2.5-1.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        {t.chip}
      </span>
      <span>{t.how}</span>
      <a href={proofHref}>
        {t.proof} <small>({t.sandbox})</small>
      </a>
    </p>
  );
}
