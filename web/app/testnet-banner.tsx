import type { Locale } from './use-locale';

/** TestnetBanner + ChainChip (design-system.md B7): shown on every sponsor screen until
 *  mainnet is approved. There is no mainnet variant. */
const text: Record<Locale, string> = {
  fr: 'Réseau de test. Pas d’argent réel.',
  en: 'Test network. No real money.',
  ar: 'شبكة اختبار. لا أموال حقيقية.',
};

export function TestnetBanner({ locale }: { locale: Locale }) {
  return (
    <div className="testnet-banner" role="note">
      <span>{text[locale]}</span>
      <span className="chain-chip" dir="ltr">
        Base Sepolia
      </span>
    </div>
  );
}
