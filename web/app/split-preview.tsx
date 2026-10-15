import type { Locale } from './use-locale';

/** SplitPreview (design-system.md §2): bar without labels (aria-hidden), then a visible
 *  legend with swatches and amounts, then the detail line. Association leg is floored to the
 *  cent; the admin leg is the remainder and is a cap (Financial rule: documented costs only,
 *  unused remainder to named charities). Copy: Whitey (admin = up to 10% for documented costs,
 *  the rest to named charities); FR reuses the existing sponsor-page wording, ar falls back to en. */
const EN_ADMIN = 'up to 10% for documented costs, the rest goes to named charities';
const copy: Record<Locale, { detail: (a: string, b: string) => string; rounding: string; assoc: string; admin: string }> = {
  fr: { detail: (a, b) => `${a} € → association, en USDC sur Base · ${b} € au maximum → coûts documentés en euros ; tout reliquat va à des associations locales nommées`, rounding: 'La part de l’association est arrondie au centime inférieur ; le reste va aux frais.', assoc: 'association', admin: 'jusqu’à 10 % couvrent uniquement les coûts documentés ; le reste va à des associations locales nommées' },
  en: { detail: (a, b) => `€${a} → association as USDC on Base · up to €${b} → documented costs in EUR, the rest goes to named charities`, rounding: 'The association share is rounded down to the cent; the remainder goes to running costs.', assoc: 'association', admin: EN_ADMIN },
  ar: { detail: (a, b) => `€${a} → association as USDC on Base · up to €${b} → documented costs in EUR, the rest goes to named charities`, rounding: 'The association share is rounded down to the cent; the remainder goes to running costs.', assoc: 'association', admin: EN_ADMIN },
};

export function SplitPreview({ locale, amountCents }: { locale: Locale; amountCents: number }) {
  const assoc = Math.floor(amountCents * 0.9);
  const admin = amountCents - assoc;
  const fmt = (c: number) => (locale === 'fr' ? (c / 100).toFixed(2).replace('.', ',') : (c / 100).toFixed(2));
  const t = copy[locale];
  return (
    <div className="split">
      <div className="split-bar" aria-hidden="true">
        <span style={{ inlineSize: `${(assoc / amountCents) * 100}%` }} />
        <span style={{ inlineSize: `${(admin / amountCents) * 100}%` }} />
      </div>
      <ul className="split-legend">
        <li>
          <span className="swatch assoc" aria-hidden="true" /> <bdi dir="ltr">≥90% · {fmt(assoc)} €</bdi> {t.assoc}
        </li>
        <li>
          <span className="swatch admin" aria-hidden="true" /> <bdi dir="ltr">≤10% · {fmt(admin)} €</bdi> {t.admin}
        </li>
      </ul>
      <p>{t.detail(fmt(assoc), fmt(admin))}</p>
      <p className="freshness">{t.rounding}</p>
    </div>
  );
}
