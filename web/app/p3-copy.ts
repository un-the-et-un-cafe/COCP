import deck from './deck.json';
import type { Locale } from './use-locale';

/* Part 3 copy from Copy Deck v0.3.4 (deck.json). `extra` holds the settlement-detail labels that
 * have no deck key yet (FR/EN, pending Whitey). ar falls back to en: no machine translation.
 * receipt.refundWindow is rendered with its [OFFEN] placeholder (no day count from config), and
 * The deck's fiscal-document key is deliberately not used (no such claim until counsel confirms). */
const extra = {
  fr: {
    batchTitle: 'Détail du versement',
    batch: 'Lot',
    association: 'Association',
    conversion: 'EUR → USDC',
    rate: 'Conversion (sandbox)',
    reconciliation: 'Rapprochement',
    recOk: 'Conforme',
    recMismatch: 'Écart',
    noTx: 'Aucune transaction publique pour ce lot : répétition synthétique, rien n’a été envoyé sur la chaîne.',
  },
  en: {
    batchTitle: 'Settlement detail',
    batch: 'Batch',
    association: 'Association',
    conversion: 'EUR → USDC',
    rate: 'Conversion (sandbox)',
    reconciliation: 'Reconciliation',
    recOk: 'Matches',
    recMismatch: 'Mismatch',
    noTx: 'No public transaction for this batch: synthetic rehearsal, nothing was sent on-chain.',
  },
};

const fromDeck = (l: 'fr' | 'en') => {
  const d = deck[l];
  return {
    backSponsors: d['sponsor.back'],
    backLedger: d['ledger.title'],
    package: d['checkout.package'],
    recipient: d['checkout.recipient'],
    mostNeeded: d['checkout.mostNeeded'],
    recipientNote: d['checkout.recipientNote'],
    payOff: d['checkout.payOff'],
    sample: d['checkout.sampleReceipt'],
    synthetic: d['receipt.synthetic'],
    refundOpen: d['receipt.refundOpen'],
    refundClosed: d['receipt.refundClosed'],
    seeBatch: d['receipt.seeBatch'],
    notFound: d['receipt.notFound'],
    refundWindow: d['receipt.refundWindow'],
  };
};

export function p3Copy(locale: Locale) {
  const lang = locale === 'fr' ? 'fr' : 'en';
  return { lang, d: deck[lang], x: { ...extra[lang], ...fromDeck(lang) } } as const;
}

export const eur = (cents: number, lang: 'fr' | 'en') => {
  const v = (cents / 100).toFixed(2);
  return lang === 'fr' ? `${v.replace('.', ',')} €` : `€${v}`;
};
export const usdc = (micro: number) => `${(micro / 1e6).toFixed(2)} USDC`;
export const parisDate = (iso: string, lang: 'fr' | 'en') =>
  new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(iso)) + ' (Paris)';
