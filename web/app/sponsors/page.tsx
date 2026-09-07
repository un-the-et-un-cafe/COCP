import { ArrowLeft, BadgeCheck, FileCheck2, HeartHandshake, Languages, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const offers = [
  { price: '79 €', name: 'Sponsor fondateur', result: 'Finance une session de vérification. Comprend une preuve publique, une reconnaissance limitée dans le temps et une note d’impact agrégée.' },
  { price: '149 €', name: 'Langue supplémentaire', result: 'Finance une traduction relue et un lot de cartes QR, après validation du traducteur et du partenaire de distribution.' },
  { price: '249 €', name: 'Pack de vérification', result: 'Nettoyage et préparation de 30 fiches publiques au maximum, avec sources et journal des modifications.' },
];

export default function SponsorsPage() {
  return (
    <main className="sponsor-page">
      <header className="site-header">
        <Link className="brand-block brand-home" href="/">
          <span className="brand-mark" aria-hidden="true">C</span>
          <div><p className="brand-name">Calais Open Commons</p><p className="brand-note">Partenariats responsables</p></div>
        </Link>
        <Link className="directory-link" href="/"><ArrowLeft size={18} aria-hidden="true" />Répertoire</Link>
      </header>

      <section className="sponsor-hero">
        <p className="eyebrow">Financer un résultat public</p>
        <h1>Soutenez des informations locales fiables et gratuites</h1>
        <p>Un sponsor finance la vérification, la traduction ou la diffusion. Il n’achète jamais de données, de classement ni d’accès aux bénéficiaires.</p>
        <output className="disabled-notice"><ShieldCheck size={20} aria-hidden="true" /><span><strong>Les paiements ne sont pas encore activés.</strong> L’entité responsable, la facturation, les comptes et les procédures de remboursement doivent d’abord être approuvés.</span></output>
      </section>

      <section className="sponsor-section" aria-labelledby="offers-title">
        <div className="section-heading"><p className="eyebrow">Offres fixes</p><h2 id="offers-title">Choisissez le résultat à financer</h2></div>
        <div className="offer-grid">
          {offers.map((offer) => <article className="offer-card" key={offer.name}><p className="offer-price">{offer.price}</p><h3>{offer.name}</h3><p>{offer.result}</p><span className="pending-label">Ouverture après validation</span></article>)}
        </div>
      </section>

      <section className="sponsor-section allocation-section" aria-labelledby="allocation-title">
        <div><p className="eyebrow">Règle financière</p><h2 id="allocation-title">Chaque euro doit être traçable</h2><p>La politique cible affecte 90 % de chaque sponsoring au bénéficiaire associatif sélectionné et 10 % à l’administration du projet avant frais et taxes.</p><p><strong>Après remboursements, taxes, frais de paiement et coûts de fonctionnement documentés, 100 % du bénéfice net est reversé chaque mois à des associations locales nommées.</strong></p></div>
        <dl className="allocation-list"><div><dt>90 %</dt><dd>Affectation associative cible</dd></div><div><dt>10 %</dt><dd>Administration avant coûts</dd></div><div><dt>100 %</dt><dd>Bénéfice net reversé</dd></div></dl>
      </section>

      <section className="sponsor-section" aria-labelledby="evidence-title">
        <div className="section-heading"><p className="eyebrow">Preuves et limites</p><h2 id="evidence-title">Ce que reçoit un sponsor</h2></div>
        <div className="evidence-grid">
          <article><FileCheck2 aria-hidden="true" /><h3>Preuve claire</h3><p>Reçu ou facture, affectation, statut du paiement et résultat financé.</p></article>
          <article><BadgeCheck aria-hidden="true" /><h3>Reconnaissance consentie</h3><p>Nom ou logo uniquement avec accord, date d’expiration et retrait simple.</p></article>
          <article><Languages aria-hidden="true" /><h3>Impact utile</h3><p>Fiches vérifiées, langues relues et supports distribués, mesurés sans profilage.</p></article>
          <article><HeartHandshake aria-hidden="true" /><h3>Aucune contrepartie cachée</h3><p>Aucun accès aux personnes, aucune publicité dans les services essentiels et aucune influence éditoriale.</p></article>
        </div>
      </section>
    </main>
  );
}
