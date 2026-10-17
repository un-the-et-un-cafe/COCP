import Link from 'next/link';
import type { Locale } from './use-locale';
import { CrossIcon, MailIcon, MoonIcon, PhoneIcon } from './marks';
import strip from './deck-strip.json';

// Subset of deck.json (Copy Deck v0.3.3) so pages that only need the strip don't load the deck.
type DeckKey = keyof typeof strip.fr;
const tr = (l: 'fr' | 'en', k: DeckKey) => strip[l][k];

/** EmergencyStrip (design-system.md §2): four always-visible buttons in Jakob's order —
 *  115, 112, 15 (SAMU), Abri ce soir — on every Part 1 page. Never collapsed or hidden.
 *  Copy: COCP-Copy-Deck-v0.3 (fr source, en reference). ar keeps the existing reviewed
 *  strings; deck keys without an ar translation fall back to en until the human translator
 *  delivers (deck: "TODO human translator"). 17 and 114 are secondary 48px full-width buttons in
 *  one column (deck v0.3.3: emergency.more, emergency.btn.17, emergency.btn.114). */
type Copy = { heading: string; b112: string; b15: string; b115: string; tonight: string; more: string; police: string; sms: string };
/** Deck "115 · Abri" → "Abri" (the number is rendered separately in <bdi>). */
const label = (l: 'fr' | 'en', k: DeckKey) => tr(l, k).replace(/^\d+\s*·\s*/, '');
const fromDeck = (l: 'fr' | 'en'): Copy => ({
  heading: tr(l, 'emergency.heading'),
  b112: label(l, 'emergency.btn.112'),
  b15: label(l, 'emergency.btn.15'),
  b115: label(l, 'emergency.btn.115'),
  tonight: tr(l, 'emergency.btn.shelterTonight'),
  more: tr(l, 'emergency.more'),
  police: label(l, 'emergency.btn.17'),
  sms: label(l, 'emergency.btn.114'),
});
// ar: the existing reviewed strings; "Abri ce soir" has no ar translation yet → isolated en fallback.
const copy: Record<Locale, Copy> = {
  fr: fromDeck('fr'),
  en: fromDeck('en'),
  ar: { heading: 'الطوارئ', b112: 'الطوارئ العامة', b15: 'الطوارئ الطبية', b115: 'الإيواء الطارئ', tonight: '', more: 'أرقام أخرى', police: 'الشرطة', sms: 'رسائل قصيرة للصم' },
};

export function EmergencyStrip({ locale, headingLevel = 2 }: { locale: Locale; headingLevel?: 1 | 2 }) {
  const t = copy[locale];
  const H = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <section className="emergency-band" aria-labelledby="emergency-title">
      <H id="emergency-title" className="emergency-heading">
        <PhoneIcon /> {t.heading}
      </H>
      <div className="emergency-grid">
        <a className="call-btn" href="tel:115">
          <PhoneIcon /> <bdi dir="ltr">115</bdi> <span>{t.b115}</span>
        </a>
        <a className="call-btn" href="tel:112">
          <PhoneIcon /> <bdi dir="ltr">112</bdi> <span>{t.b112}</span>
        </a>
        <a className="call-btn" href="tel:15">
          <CrossIcon /> <bdi dir="ltr">15</bdi> <span>{t.b15}</span>
        </a>
        <Link className="call-btn" href="/shelter-tonight">
          <MoonIcon /> {t.tonight ? <span>{t.tonight}</span> : <span lang="en" dir="ltr">{tr('en', 'emergency.btn.shelterTonight')}</span>}
        </Link>
      </div>
      <p className="emergency-more">{t.more}</p>
      <div className="emergency-more-grid">
        <a className="call-btn call-btn-2" href="tel:17">
          <PhoneIcon /> <bdi dir="ltr">17</bdi> <span>{t.police}</span>
        </a>
        <a className="call-btn call-btn-2" href="sms:114">
          <MailIcon /> <bdi dir="ltr">114</bdi> <span>{t.sms}</span>
        </a>
      </div>
    </section>
  );
}
