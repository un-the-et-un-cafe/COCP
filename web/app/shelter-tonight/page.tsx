'use client';

import Link from 'next/link';
import { ArrowLeft, Languages } from 'lucide-react';
import listings from '../../data/listings.json';
import { EmergencyStrip } from '../emergency-strip';
import { PhoneIcon } from '../marks';
import { isRtl, useLocale, type Locale } from '../use-locale';

/** Abri ce soir (screens.md P1 #6). Copy: COCP-Copy-Deck-v0.3 (fr/en); ar falls back to en
 *  until the human translator delivers. Only real listings tagged as shelter are shown —
 *  none exist in the current data, so the page shows the hedged empty state + 115. */
type Copy = { title: string; hedge: string; call: string; empty: string; back: string; language: string; note: string };
const copy: Record<Locale, Copy> = {
  fr: { title: 'Abri ce soir', hedge: 'Des places peuvent manquer. Vérifiez les horaires.', call: 'Appeler le 115', empty: 'Rien trouvé ici. Appelez le 115 pour un abri.', back: 'Répertoire', language: 'Langue', note: 'Hébergement d’urgence' },
  en: { title: 'Shelter tonight', hedge: 'There may be no space. Check the hours.', call: 'Call 115', empty: 'Nothing found here. Call 115 for shelter.', back: 'Directory', language: 'Language', note: 'Emergency shelter' },
  ar: { title: 'Shelter tonight', hedge: 'There may be no space. Check the hours.', call: 'Call 115', empty: 'Nothing found here. Call 115 for shelter.', back: 'الدليل', language: 'اللغة', note: 'الإيواء الطارئ' },
};

type Listing = { id: string; name: string; categories: string[]; location: { label: string }; source: { notes: string } };
const all: Listing[] = (Array.isArray(listings) ? listings : (listings as { listings: Listing[] }).listings) as Listing[];
const shelter = all.filter((l) => l.categories.includes('shelter'));

export default function ShelterTonightPage() {
  const [locale, setLocale] = useLocale();
  const t = copy[locale];
  return (
    <main className="privacy-page" dir={isRtl(locale) ? 'rtl' : 'ltr'}>
      <header className="site-header">
        <Link className="brand-block brand-home" href="/" aria-label="Calais">
          <span className="brand-mark" aria-hidden="true">C</span>
          <div>
            <p className="brand-name">Calais Open Commons</p>
            <p className="brand-note">{t.note}</p>
          </div>
        </Link>
        <div className="header-actions">
          <Link className="directory-link" href="/">
            <ArrowLeft size={18} aria-hidden="true" />
            {t.back}
          </Link>
          <label className="language-control">
            <Languages size={19} aria-hidden="true" />
            <span className="sr-only">{t.language}</span>
            <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </label>
        </div>
      </header>
      <EmergencyStrip locale={locale} />
      <section className="privacy-shell shelter-shell">
        <h1>{t.title}</h1>
        <a className="call-btn call-btn-lg" href="tel:115">
          <PhoneIcon /> <bdi dir="ltr">115</bdi> <span>{t.call}</span>
        </a>
        <p className="alert warn">{t.hedge}</p>
        {shelter.length === 0 ? (
          <p className="empty-state">{t.empty}</p>
        ) : (
          <div className="listing-grid">
            {shelter.map((l) => (
              <article className="listing-card" key={l.id}>
                <h2>{l.name}</h2>
                <p className="location">{l.location.label}</p>
                <p className="service-note">{l.source.notes}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
