import type { Locale } from './use-locale';

/** SplitPreview (design-system.md §2): bar without labels (aria-hidden), then a visible
 *  legend with swatches and amounts, then the detail line. Association leg is floored to the
 *  cent; the admin leg is the remainder and is a cap (Financial rule: documented costs only,
 *  unused remainder to named charities). Copy: COCP-Copy-Deck-v0.3 split.detail /
 *  split.rounding (fr/en); ar uses en until the human translator delivers. */
const copy: Record<Locale, { detail: (a: string, b: string) => string; rounding: string; assoc: string; admin: string }> = {
  fr: { detail: (a, b) => `${a} € → association, en USDC sur Base · ${b} € → frais COCP, restent en euros`, rounding: 'La part de l’association est arrondie au centime inférieur ; le reste va aux frais.', assoc: 'association', admin: 'frais (plafond)' },
  en: { detail: (a, b) => `€${a} → association as USDC on Base · €${b} → COCP admin, stays in EUR`, rounding: 'The association share is rounded down to the cent; the remainder goes to running costs.', assoc: 'association', admin: 'admin (cap)' },
  ar: { detail: (a, b) => `€${a} → association as USDC on Base · €${b} → COCP admin, stays in EUR`, rounding: 'The association share is rounded down to the cent; the remainder goes to running costs.', assoc: 'association', admin: 'admin (cap)' },
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
