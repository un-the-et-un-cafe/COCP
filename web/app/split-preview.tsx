import type { Locale } from './use-locale';
import deck from './deck.json';

/** SplitPreview (design-system.md §2): bar without labels (aria-hidden), then a visible
 *  legend with swatches and amounts, then the deck sentence + detail + rounding lines.
 *  Copy: COCP Copy Deck v0.3.2 (split.sentence, split.detail, split.rounding); ar falls back
 *  to en (no machine translation). Association leg is floored to the cent; admin is the cap. */
const legend: Record<'fr' | 'en', { assoc: string; admin: string }> = {
  fr: { assoc: 'association', admin: 'frais COCP' },
  en: { assoc: 'association', admin: 'COCP admin' },
};

export function SplitPreview({ locale, amountCents }: { locale: Locale; amountCents: number }) {
  const lang = locale === 'fr' ? 'fr' : 'en';
  const d = deck[lang];
  const assoc = Math.floor(amountCents * 0.9);
  const admin = amountCents - assoc;
  const fmt = (c: number) => (lang === 'fr' ? (c / 100).toFixed(2).replace('.', ',') : (c / 100).toFixed(2));
  const detail = d['split.detail'].replace('{assocAmount}', fmt(assoc)).replace('{adminAmount}', fmt(admin));
  return (
    <div className="split" lang={lang}>
      <div className="split-bar" aria-hidden="true">
        <span style={{ inlineSize: `${(assoc / amountCents) * 100}%` }} />
        <span style={{ inlineSize: `${(admin / amountCents) * 100}%` }} />
      </div>
      <ul className="split-legend">
        <li>
          <span className="swatch assoc" aria-hidden="true" /> <bdi dir="ltr">≥90% · {fmt(assoc)} €</bdi> {legend[lang].assoc}
        </li>
        <li>
          <span className="swatch admin" aria-hidden="true" /> <bdi dir="ltr">≤10% · {fmt(admin)} €</bdi> {legend[lang].admin}
        </li>
      </ul>
      <p>{d['split.sentence']}</p>
      <p>{detail}</p>
      <p className="freshness">{d['split.rounding']}</p>
    </div>
  );
}
