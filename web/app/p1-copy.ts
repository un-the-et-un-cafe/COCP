import { tr, type DeckKey } from './deck';
import type { Locale } from './use-locale';

/** Part 1 copy from COCP Copy Deck v0.3.3 (fr source, en reference). ar has no translation in
 *  the deck yet ("TODO human translator"), so it falls back to en until it is delivered.
 *  `own` strings are not in the deck yet (pending Whitey). */
const build = (l: 'fr' | 'en') => {
  const d = (k: DeckKey) => tr(l, k);
  const own = {
    fr: { openNowNoHours: 'Aucun horaire confirmé pour l’instant : ce filtre ne trouve rien. Désactivez-le pour voir la liste.', what: 'Quoi', who: 'Pour qui', whoAll: 'Tout le monde', details: 'Détails', back: 'Retour', guidePage: 'guide p.', call: 'Appeler', directions: 'Itinéraire (texte)', addressPending: 'Adresse et repère à confirmer.' },
    en: { openNowNoHours: 'No confirmed hours yet, so this filter finds nothing. Turn it off to see the list.', what: 'What', who: 'Who it’s for', whoAll: 'Everyone', details: 'Details', back: 'Back', guidePage: 'guide p.', call: 'Call', directions: 'Text directions', addressPending: 'Address and landmark to be confirmed.' },
  }[l];
  return {
    ...own,
    openNow: d('status.open'),
    hoursUnknown: d('listing.hoursUnknown'),
    toggleOpenNow: d('toggle.openNow'),
    listEmpty: d('list.empty'),
    offline: (date: string) => d('offline.banner').replace('{date}', date),
    verified: (a: string, date: string) => d('freshness.verified').replace('{association}', a).replace('{date}', date),
    unverified: (p: number) => `${d('listing.unverified')} · ${own.guidePage} ${p}`,
    stale30: d('freshness.stale30'),
    stale90: d('freshness.stale90'),
    reportButton: d('report.button'),
    reportTitle: d('report.title'),
    reasons: { closed: d('report.reason.closed'), hours: d('report.reason.hours'), moved: d('report.reason.moved'), other: d('report.reason.other') },
    submit: d('report.submit'),
    success: d('report.success'),
    queued: d('report.queued'),
    error: d('report.error'),
    sending: d('report.sending'),
    close: d('common.close'),
    when: d('detail.when'),
    where: d('detail.where'),
    map: d('map.viewMap'),
    notFound: d('common.notFound'),
    pickLanguage: d('lang.pick'),
    needs: d('home.needs'),
  };
};
export type P1Copy = ReturnType<typeof build>;
const fr = build('fr');
const en = build('en');
export const p1Copy: Record<Locale, P1Copy> = { fr, en, ar: en };
