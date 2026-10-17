import Link from 'next/link';
import type { Locale } from './use-locale';
import { CrossIcon, MoonIcon, PhoneIcon } from './marks';

/** EmergencyStrip (design-system.md §2): four always-visible buttons in Jakob's order —
 *  115, 112, 15 (SAMU), Abri ce soir — on every Part 1 page. Never collapsed or hidden.
 *  Copy: COCP-Copy-Deck-v0.3 (fr source, en reference). ar keeps the existing reviewed
 *  strings; deck keys without an ar translation fall back to en until the human translator
 *  delivers (deck: "TODO human translator"). 17 and 114 are two secondary 48px call buttons
 *  (mockups.html#p1-area-list); their labels await deck keys emergency.more/btn.17/btn.114. */
type Copy = { heading: string; b112: string; b15: string; b115: string; tonight: string; more: string; police: string; sms: string };
const copy: Record<Locale, Copy> = {
  fr: { heading: 'Urgence', b112: 'Urgence', b15: 'SAMU (médecin)', b115: 'Abri', tonight: 'Abri ce soir', more: 'Autres numéros :', police: 'Police', sms: 'SMS sourds / malentendants' },
  en: { heading: 'Emergency', b112: 'Emergency', b15: 'SAMU (medical)', b115: 'Shelter', tonight: 'Shelter tonight', more: 'Other numbers:', police: 'Police', sms: 'SMS for deaf / hard of hearing' },
  ar: { heading: 'الطوارئ', b112: 'الطوارئ العامة', b15: 'الطوارئ الطبية', b115: 'الإيواء الطارئ', tonight: 'Shelter tonight', more: 'أرقام أخرى:', police: 'الشرطة', sms: 'رسائل قصيرة للصم' },
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
          <MoonIcon /> <span>{t.tonight}</span>
        </Link>
      </div>
      <p className="emergency-more">{t.more}</p>
      <div className="emergency-grid">
        <a className="call-btn call-btn-2" href="tel:17">
          <PhoneIcon /> <bdi dir="ltr">17</bdi> <span>{t.police}</span>
        </a>
        <a className="call-btn call-btn-2" href="sms:114">
          <PhoneIcon /> <bdi dir="ltr">114</bdi> <span>{t.sms}</span>
        </a>
      </div>
    </section>
  );
}
