import deck from './deck-p3.json';
import type { Locale } from './use-locale';

/* Part 3 copy from Copy Deck v0.3.5 (deck-p3.json: sponsor/public keys, so Part 1 pages never load
 * them). ar falls back to en: no machine translation. receipt.refundWindow is rendered with its
 * [OFFEN] placeholder (no day count from config), and the deck's fiscal-document key is
 * deliberately not used (no such claim until counsel confirms). */

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
    batchTitle: d['batch.title'],
    batch: d['batch.batch'],
    association: d['batch.association'],
    conversion: d['batch.conversion'],
    rate: d['batch.rate'],
    reconciliation: d['batch.reconciliation'],
    recOk: d['batch.recOk'],
    recMismatch: d['batch.recMismatch'],
    noTx: d['batch.noTx'],
  };
};

export function p3Copy(locale: Locale) {
  const lang = locale === 'fr' ? 'fr' : 'en';
  return { lang, d: deck[lang], x: fromDeck(lang) } as const;
}

export const eur = (cents: number, lang: 'fr' | 'en') => {
  const v = (cents / 100).toFixed(2);
  return lang === 'fr' ? `${v.replace('.', ',')} €` : `€${v}`;
};
export const usdc = (micro: number) => `${(micro / 1e6).toFixed(2)} USDC`;
export const parisDate = (iso: string, lang: 'fr' | 'en') =>
  new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(iso)) + ' (Paris)';
