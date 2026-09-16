'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Languages,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import publishedListings from '../data/published-listings.json';
import candidateListings from '../data/listings.json';
import fr from '../locales/fr.json';
import en from '../locales/en.json';
import ar from '../locales/ar.json';
import { useLocale, type Locale } from './use-locale';

type Copy = typeof fr;
const copies: Record<Locale, Copy> = { fr, en, ar };
const supportLabels: Record<Locale, string> = {
  fr: 'Financer la vérification',
  en: 'Fund verification',
  ar: 'تمويل التحقق',
};
const changeLabels: Record<Locale, string> = {
  fr: 'Modifications et exports',
  en: 'Changes and exports',
  ar: 'التغييرات والتصدير',
};
const correctionLabels: Record<Locale, string> = {
  fr: 'Signaler une correction',
  en: 'Report a correction',
  ar: 'الإبلاغ عن تصحيح',
};
const accessibilityLabels: Record<Locale, string> = {
  fr: 'Accessibilité',
  en: 'Accessibility',
  ar: 'إمكانية الوصول',
};
const privacyLabels: Record<Locale, string> = {
  fr: 'Confidentialité',
  en: 'Privacy',
  ar: 'الخصوصية',
};
const activityLabels: Record<Locale, string> = {
  fr: 'Idées d’activités',
  en: 'Activity ideas',
  ar: 'أفكار الأنشطة',
};
const readinessLabels: Record<Locale, string> = {
  fr: 'État du lancement',
  en: 'Launch status',
  ar: 'حالة الإطلاق',
};
const categories = [
  'all',
  'emergency',
  'food',
  'showers',
  'water',
  'healthcare',
  'community',
  'legal',
] as const;
type Listing = {
  id: string;
  name: string;
  categories: string[];
  location: { label: string; map_url: string | null };
  source: { notes: string; page: number };
  verification: {
    status: string;
    checked_at: string | null;
    expires_at: string | null;
  };
};
type DatabaseStatus = {
  state: 'checking' | 'synced' | 'unavailable';
  listingCount?: number;
  environment?: 'development' | 'production';
  syncedAt?: number;
};
const releasedListings = publishedListings as Listing[];
const sourceListings = candidateListings as Listing[];
const buildEnvironment = (
  import.meta as ImportMeta & { env?: { VITE_CONVEX_SITE_URL?: string } }
).env;
const databaseStatusUrl = buildEnvironment?.VITE_CONVEX_SITE_URL
  ? `${buildEnvironment.VITE_CONVEX_SITE_URL.replace(/\/$/, '')}/directory-status`
  : null;

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

async function sourceHash() {
  const bytes = new TextEncoder().encode(canonicalJson(sourceListings));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return `sha256-${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export default function Home() {
  const [locale, changeLocale] = useLocale();
  const [category, setCategory] = useState<(typeof categories)[number]>('all');
  const [query, setQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus>({
    state: databaseStatusUrl ? 'checking' : 'unavailable',
  });
  const [databaseCheck, setDatabaseCheck] = useState(0);
  const copy = copies[locale];
  useEffect(() => {
    const refresh = () => setCurrentTime(Date.now());
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!databaseStatusUrl) {
      return;
    }
    const controller = new AbortController();
    Promise.all([
      fetch(databaseStatusUrl, {
        cache: 'no-store',
        signal: controller.signal,
      }),
      sourceHash(),
    ])
      .then(async ([response, expectedSourceHash]) => {
        if (!response.ok) throw new Error('Directory status is unavailable.');
        const status = (await response.json()) as {
          synced: boolean;
          listingCount: number;
          sourceHash?: string;
          environment?: 'development' | 'production';
          syncedAt?: number;
        };
        return {
          ...status,
          synced: status.synced && status.sourceHash === expectedSourceHash,
        };
      })
      .then((status) =>
        setDatabaseStatus(
          status.synced
            ? {
                state: 'synced',
                listingCount: status.listingCount,
                environment: status.environment,
                syncedAt: status.syncedAt,
              }
            : { state: 'unavailable' },
        ),
      )
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        setDatabaseStatus({ state: 'unavailable' });
      });
    return () => controller.abort();
  }, [databaseCheck]);
  const databaseSyncedAt = useMemo(() => {
    if (!databaseStatus.syncedAt) return null;
    return new Intl.DateTimeFormat(
      locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-GB' : 'ar',
      { dateStyle: 'medium', timeStyle: 'short' },
    ).format(new Date(databaseStatus.syncedAt));
  }, [databaseStatus.syncedAt, locale]);
  const visibleListings = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    const currentReleasedListings = releasedListings.filter(
      (listing) =>
        listing.verification.status === 'verified' &&
        listing.verification.expires_at &&
        (currentTime === 0 ||
          Date.parse(listing.verification.expires_at) > currentTime),
    );
    const releasedIds = new Set(
      currentReleasedListings.map((listing) => listing.id),
    );
    const listings = [
      ...currentReleasedListings,
      ...sourceListings.filter((listing) => !releasedIds.has(listing.id)),
    ];
    return listings.filter((listing) => {
      const inCategory =
        category === 'all' || listing.categories.includes(category);
      const text = [listing.name, listing.location.label, listing.source.notes]
        .join(' ')
        .toLocaleLowerCase(locale);
      return inCategory && (!needle || text.includes(needle));
    });
  }, [category, currentTime, locale, query]);

  return (
    <main dir={locale === 'ar' ? 'rtl' : 'ltr'} className="page">
      <a className="skip-link" href="#services">
        {copy.skip}
      </a>
      <header className="site-header">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <div>
            <p className="brand-name">Calais Open Commons</p>
            <p className="brand-note">{copy.private_access}</p>
          </div>
        </div>
        <div className="header-actions">
          <Link className="changes-link" href="/changes">
            {changeLabels[locale]}
          </Link>
          <Link className="support-link" href="/sponsors">
            {supportLabels[locale]}
          </Link>
          <label className="language-control">
            <Languages size={19} aria-hidden="true" />
            <span className="sr-only">{copy.language}</span>
            <select
              value={locale}
              onChange={(event) => changeLocale(event.target.value as Locale)}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </label>
        </div>
      </header>

      <section className="emergency-band" aria-labelledby="emergency-title">
        <div className="emergency-intro">
          <AlertTriangle size={24} aria-hidden="true" />
          <div>
            <h1 id="emergency-title">{copy.emergency_title}</h1>
            <p>{copy.emergency_note}</p>
          </div>
        </div>
        <div className="emergency-actions">
          <a href="tel:112">
            <strong>112</strong>
            <span>{copy.emergency_general}</span>
          </a>
          <a href="tel:115">
            <strong>115</strong>
            <span>{copy.emergency_shelter}</span>
          </a>
          <a href="tel:15">
            <strong>15</strong>
            <span>{copy.emergency_medical}</span>
          </a>
        </div>
      </section>

      <section
        className="directory-shell"
        id="services"
        aria-labelledby="directory-title"
      >
        <div className="directory-heading">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2 id="directory-title">{copy.directory_title}</h2>
            <p>{copy.directory_intro}</p>
          </div>
          <div className="directory-indicators">
            <div className="freshness-key">
              <Clock3 size={18} aria-hidden="true" />
              <span>{copy.unverified_key}</span>
            </div>
            <div
              className={`database-key ${databaseStatus.state}`}
              aria-live="polite"
            >
              <Database size={18} aria-hidden="true" />
              <span className="database-copy">
                {databaseStatus.state === 'checking'
                  ? copy.database_checking
                  : databaseStatus.state === 'synced'
                    ? `${databaseStatus.environment === 'production' ? copy.database_production : copy.database_development}: ${databaseStatus.listingCount} ${copy.database_entries}`
                    : copy.database_unavailable}
                {databaseSyncedAt && databaseStatus.syncedAt ? (
                  <small>
                    {copy.database_synced_at}{' '}
                    <time
                      dateTime={new Date(databaseStatus.syncedAt).toISOString()}
                    >
                      {databaseSyncedAt}
                    </time>
                  </small>
                ) : null}
              </span>
              {databaseStatus.state === 'unavailable' && databaseStatusUrl ? (
                <button
                  className="database-retry"
                  type="button"
                  onClick={() => {
                    setDatabaseStatus({ state: 'checking' });
                    setDatabaseCheck((attempt) => attempt + 1);
                  }}
                >
                  <RefreshCw size={15} aria-hidden="true" />
                  {copy.database_retry}
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <search className="controls">
          <label className="search-box">
            <Search size={20} aria-hidden="true" />
            <span className="sr-only">{copy.search_label}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.search_placeholder}
            />
          </label>
          <div className="category-list" aria-label={copy.category_label}>
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {copy.categories[item]}
              </button>
            ))}
          </div>
        </search>
        <p className="result-count" aria-live="polite">
          {visibleListings.length} {copy.results}
        </p>
        <div className="listing-grid">
          {visibleListings.map((listing) => (
            <article className="listing-card" key={listing.id}>
              <div className="listing-topline">
                {listing.verification.status === 'verified' ? (
                  <span className="status verified">
                    <CheckCircle2 size={15} aria-hidden="true" />
                    {copy.verified}
                  </span>
                ) : (
                  <span className="status">
                    <AlertTriangle size={15} aria-hidden="true" />
                    {copy.unverified}
                  </span>
                )}
                <span>
                  {copy.source_page} {listing.source.page}
                </span>
              </div>
              <h3>{listing.name}</h3>
              <p className="location">
                <MapPin size={18} aria-hidden="true" />
                {listing.location.label}
              </p>
              <p className="service-note">{listing.source.notes}</p>
              {listing.verification.status === 'verified' &&
              listing.verification.checked_at &&
              listing.verification.expires_at ? (
                <dl>
                  <div>
                    <dt>{copy.last_checked}</dt>
                    <dd>{listing.verification.checked_at.slice(0, 10)}</dd>
                  </div>
                  <div>
                    <dt>{copy.expires}</dt>
                    <dd>{listing.verification.expires_at.slice(0, 10)}</dd>
                  </div>
                </dl>
              ) : (
                <dl>
                  <div>
                    <dt>{copy.source_status}</dt>
                    <dd>{copy.listed_in_guide}</dd>
                  </div>
                  <div>
                    <dt>{copy.before_travel}</dt>
                    <dd>{copy.confirm_service}</dd>
                  </div>
                </dl>
              )}
              <div className="card-actions">
                {listing.location.map_url ? (
                  <a
                    href={listing.location.map_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={17} aria-hidden="true" />
                    {copy.map}
                  </a>
                ) : null}
                <Link href={`/corrections?listing=${listing.id}`}>
                  {correctionLabels[locale]}
                </Link>
              </div>
            </article>
          ))}
        </div>
        {visibleListings.length === 0 ? (
          <p className="empty-state">{copy.no_results}</p>
        ) : null}
      </section>
      <footer>
        <ShieldCheck size={20} aria-hidden="true" />
        <p>{copy.footer_privacy}</p>
        <Link href="/readiness">{readinessLabels[locale]}</Link>
        <Link href="/activities">{activityLabels[locale]}</Link>
        <Link href="/privacy">{privacyLabels[locale]}</Link>
        <Link href="/accessibility">{accessibilityLabels[locale]}</Link>
      </footer>
    </main>
  );
}
