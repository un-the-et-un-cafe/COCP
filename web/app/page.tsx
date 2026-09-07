'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock3, ExternalLink, Languages, MapPin, Search, ShieldCheck } from 'lucide-react';
import listings from '../data/listings.json';
import fr from '../locales/fr.json';
import en from '../locales/en.json';
import ar from '../locales/ar.json';

type Locale = 'fr' | 'en' | 'ar';
type Copy = typeof fr;
const copies: Record<Locale, Copy> = { fr, en, ar };
const supportLabels: Record<Locale, string> = { fr: 'Financer la vérification', en: 'Fund verification', ar: 'تمويل التحقق' };
const correctionLabels: Record<Locale, string> = { fr: 'Signaler une correction', en: 'Report a correction', ar: 'الإبلاغ عن تصحيح' };
const categories = ['all', 'emergency', 'food', 'water', 'healthcare', 'community', 'legal'] as const;
const localeEvent = 'cocp-locale-change';

function getLocaleSnapshot(): Locale {
  const saved = localStorage.getItem('cocp-locale');
  return saved === 'fr' || saved === 'en' || saved === 'ar' ? saved : 'fr';
}

function subscribeLocale(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(localeEvent, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(localeEvent, callback);
  };
}

export default function Home() {
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, (): Locale => 'fr');
  const [category, setCategory] = useState<(typeof categories)[number]>('all');
  const [query, setQuery] = useState('');
  const copy = copies[locale];
  const visibleListings = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return listings.filter((listing) => {
      const inCategory = category === 'all' || listing.categories.includes(category);
      const text = [listing.name, listing.location.label, listing.source.notes].join(' ').toLocaleLowerCase(locale);
      return inCategory && (!needle || text.includes(needle));
    });
  }, [category, locale, query]);

  function changeLocale(next: Locale) {
    localStorage.setItem('cocp-locale', next);
    window.dispatchEvent(new Event(localeEvent));
  }

  return (
    <main dir={locale === 'ar' ? 'rtl' : 'ltr'} className="page">
      <a className="skip-link" href="#services">{copy.skip}</a>
      <header className="site-header">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">C</span>
          <div><p className="brand-name">Calais Open Commons</p><p className="brand-note">{copy.private_access}</p></div>
        </div>
        <div className="header-actions">
          <Link className="support-link" href="/sponsors">{supportLabels[locale]}</Link>
          <label className="language-control">
            <Languages size={19} aria-hidden="true" />
            <span className="sr-only">{copy.language}</span>
            <select value={locale} onChange={(event) => changeLocale(event.target.value as Locale)}>
              <option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option>
            </select>
          </label>
        </div>
      </header>

      <section className="emergency-band" aria-labelledby="emergency-title">
        <div className="emergency-intro"><AlertTriangle size={24} aria-hidden="true" /><div><h1 id="emergency-title">{copy.emergency_title}</h1><p>{copy.emergency_note}</p></div></div>
        <div className="emergency-actions">
          <a href="tel:112"><strong>112</strong><span>{copy.emergency_general}</span></a>
          <a href="tel:115"><strong>115</strong><span>{copy.emergency_shelter}</span></a>
          <a href="tel:15"><strong>15</strong><span>{copy.emergency_medical}</span></a>
        </div>
      </section>

      <section className="directory-shell" id="services" aria-labelledby="directory-title">
        <div className="directory-heading">
          <div><p className="eyebrow">{copy.eyebrow}</p><h2 id="directory-title">{copy.directory_title}</h2><p>{copy.directory_intro}</p></div>
          <div className="freshness-key"><Clock3 size={18} aria-hidden="true" /><span>{copy.unverified_key}</span></div>
        </div>
        <search className="controls">
          <label className="search-box"><Search size={20} aria-hidden="true" /><span className="sr-only">{copy.search_label}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search_placeholder} /></label>
          <div className="category-list" aria-label={copy.category_label}>
            {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{copy.categories[item]}</button>)}
          </div>
        </search>
        <p className="result-count" aria-live="polite">{visibleListings.length} {copy.results}</p>
        <div className="listing-grid">
          {visibleListings.map((listing) => (
            <article className="listing-card" key={listing.id}>
              <div className="listing-topline"><span className="status"><AlertTriangle size={15} aria-hidden="true" />{copy.unverified}</span><span>{copy.source_page} {listing.source.page}</span></div>
              <h3>{listing.name}</h3>
              <p className="location"><MapPin size={18} aria-hidden="true" />{listing.location.label}</p>
              <p className="service-note">{listing.source.notes}</p>
              <dl><div><dt>{copy.last_checked}</dt><dd>{copy.not_checked}</dd></div><div><dt>{copy.expires}</dt><dd>{copy.not_publishable}</dd></div></dl>
              <div className="card-actions">
                {listing.location.map_url ? <a href={listing.location.map_url} target="_blank" rel="noreferrer"><ExternalLink size={17} aria-hidden="true" />{copy.map}</a> : null}
                <Link href={`/corrections?listing=${listing.id}`}>{correctionLabels[locale]}</Link>
              </div>
            </article>
          ))}
        </div>
        {visibleListings.length === 0 ? <p className="empty-state">{copy.no_results}</p> : null}
      </section>
      <footer><ShieldCheck size={20} aria-hidden="true" /><p>{copy.footer_privacy}</p></footer>
    </main>
  );
}
