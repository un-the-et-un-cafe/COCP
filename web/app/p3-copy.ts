import deck from './deck.json';
import type { Locale } from './use-locale';

/* Part 3 copy. Deck v0.3.2 keys come from deck.json; the extra labels below are not in the deck
 * yet (FR/EN written here, pending Whitey's review). ar falls back to en: no machine translation. */
const extra = {
  fr: {
    backSponsors: 'Partenariats',
    backLedger: 'Registre public',
    package: 'Forfait',
    recipient: 'Destinataire',
    mostNeeded: 'Là où c’est le plus utile',
    recipientNote: 'La liste des associations vérifiées sera publiée après leur vérification.',
    payOff: 'Le paiement test n’est pas activé sur cet aperçu : aucun paiement ne peut être lancé.',
    sample: 'Exemple de reçu (données synthétiques)',
    synthetic: 'Données synthétiques de répétition : aucun paiement réel, aucun versement réel.',
    refundWindow: (n: number) => `Délai de remboursement : ${n} jours`,
    refundClosed: 'clos',
    refundOpen: 'en cours',
    batchTitle: 'Détail du versement',
    batch: 'Lot',
    association: 'Association',
    conversion: 'EUR → USDC',
    rate: 'Conversion (sandbox)',
    reconciliation: 'Rapprochement',
    recOk: 'Conforme',
    recMismatch: 'Écart',
    noTx: 'Aucune transaction publique pour ce lot : répétition synthétique, rien n’a été envoyé sur la chaîne.',
    seeBatch: 'Voir le détail du versement',
    notFound: 'Référence introuvable.',
  },
  en: {
    backSponsors: 'Partnerships',
    backLedger: 'Public ledger',
    package: 'Package',
    recipient: 'Recipient',
    mostNeeded: 'Where most needed',
    recipientNote: 'The list of verified associations will be published once they are verified.',
    payOff: 'Test payments are not enabled on this preview: no payment can be started.',
    sample: 'Sample receipt (synthetic data)',
    synthetic: 'Synthetic rehearsal data: no real payment, no real payout.',
    refundWindow: (n: number) => `Refund window: ${n} days`,
    refundClosed: 'closed',
    refundOpen: 'open',
    batchTitle: 'Settlement detail',
    batch: 'Batch',
    association: 'Association',
    conversion: 'EUR → USDC',
    rate: 'Conversion (sandbox)',
    reconciliation: 'Reconciliation',
    recOk: 'Matches',
    recMismatch: 'Mismatch',
    noTx: 'No public transaction for this batch: synthetic rehearsal, nothing was sent on-chain.',
    seeBatch: 'See settlement detail',
    notFound: 'Reference not found.',
  },
};

export function p3Copy(locale: Locale) {
  const lang = locale === 'fr' ? 'fr' : 'en';
  return { lang, d: deck[lang], x: extra[lang] } as const;
}

export const eur = (cents: number, lang: 'fr' | 'en') => {
  const v = (cents / 100).toFixed(2);
  return lang === 'fr' ? `${v.replace('.', ',')} €` : `€${v}`;
};
export const usdc = (micro: number) => `${(micro / 1e6).toFixed(2)} USDC`;
export const parisDate = (iso: string, lang: 'fr' | 'en') =>
  new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(iso)) + ' (Paris)';
