'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileClock,
  KeyRound,
  Languages,
} from 'lucide-react';
import history from '@/data/release-history.json';
import { useLocale, type Locale } from '../use-locale';

type ReleaseSummary = {
  release_id: string;
  released_at: string;
  expires_at: string;
  key_id: string;
  listing_count: number;
  changes: { added: string[]; updated: string[]; removed: string[] };
};

const copy = {
  fr: {
    brandNote: 'Données publiques vérifiables',
    back: 'Retour au répertoire',
    language: 'Langue',
    eyebrow: 'Transparence des données',
    title: 'Modifications et exports',
    intro:
      'Chaque publication contient uniquement les fiches vérifiées et non expirées. Les fichiers signés permettent de contrôler qu’une version n’a pas été modifiée.',
    downloads: 'Téléchargements des données',
    json: 'Export JSON',
    jsonNote: 'Format structuré et portable',
    csv: 'Export CSV',
    csvNote: 'Compatible avec les tableurs',
    latest: 'Dernière version signée',
    latestNote: 'JSON et signature Ed25519',
    latestPending: 'Disponible après la première publication',
    log: 'Journal public',
    history: 'Historique des versions',
    emptyTitle: 'Aucune version signée publiée',
    emptyNote:
      'Les 21 fiches importées restent hors des exports vérifiés jusqu’à leur vérification humaine.',
    entries: 'fiches',
    changes: 'modifications',
    key: 'clé',
    added: 'Ajouts',
    updated: 'Mises à jour',
    removed: 'Retraits',
    view: 'Consulter la version',
  },
  en: {
    brandNote: 'Verifiable public data',
    back: 'Back to directory',
    language: 'Language',
    eyebrow: 'Data transparency',
    title: 'Changes and exports',
    intro:
      'Each release contains only verified, unexpired entries. Signed files make it possible to check that a version has not been changed.',
    downloads: 'Data downloads',
    json: 'JSON export',
    jsonNote: 'Structured, portable format',
    csv: 'CSV export',
    csvNote: 'Compatible with spreadsheets',
    latest: 'Latest signed release',
    latestNote: 'JSON and Ed25519 signature',
    latestPending: 'Available after the first release',
    log: 'Public log',
    history: 'Release history',
    emptyTitle: 'No signed release published',
    emptyNote:
      'The 21 imported entries remain outside verified exports until people have verified them.',
    entries: 'entries',
    changes: 'changes',
    key: 'key',
    added: 'Added',
    updated: 'Updated',
    removed: 'Removed',
    view: 'View release',
  },
  ar: {
    brandNote: 'بيانات عامة قابلة للتحقق',
    back: 'العودة إلى الدليل',
    language: 'اللغة',
    eyebrow: 'شفافية البيانات',
    title: 'التغييرات والتصدير',
    intro:
      'لا يتضمن كل إصدار إلا السجلات المتحقق منها وغير المنتهية. تتيح الملفات الموقعة التأكد من عدم تعديل الإصدار.',
    downloads: 'تنزيل البيانات',
    json: 'تصدير JSON',
    jsonNote: 'تنسيق منظم وقابل للنقل',
    csv: 'تصدير CSV',
    csvNote: 'متوافق مع جداول البيانات',
    latest: 'أحدث إصدار موقع',
    latestNote: 'JSON وتوقيع Ed25519',
    latestPending: 'يتاح بعد أول إصدار',
    log: 'السجل العام',
    history: 'سجل الإصدارات',
    emptyTitle: 'لم يُنشر أي إصدار موقع',
    emptyNote:
      'تبقى السجلات المستوردة وعددها 21 خارج ملفات التصدير المتحقق منها إلى أن يتحقق منها أشخاص.',
    entries: 'سجلاً',
    changes: 'تغييرات',
    key: 'المفتاح',
    added: 'مضاف',
    updated: 'محدّث',
    removed: 'محذوف',
    view: 'عرض الإصدار',
  },
} as const;

function countChanges(release: ReleaseSummary) {
  return (
    release.changes.added.length +
    release.changes.updated.length +
    release.changes.removed.length
  );
}

export default function ChangesPage() {
  const releases = history as ReleaseSummary[];
  const [locale, setLocale] = useLocale();
  const text = copy[locale];

  return (
    <main className="changes-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="site-header">
        <Link className="brand-block brand-home" href="/">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <div>
            <p className="brand-name">Calais Open Commons</p>
            <p className="brand-note">{text.brandNote}</p>
          </div>
        </Link>
        <div className="header-actions">
          <Link className="directory-link" href="/">
            <ArrowLeft size={18} aria-hidden="true" />
            {text.back}
          </Link>
          <label className="language-control">
            <Languages size={19} aria-hidden="true" />
            <span className="sr-only">{text.language}</span>
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </label>
        </div>
      </header>

      <section className="changes-shell">
        <div className="changes-intro">
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
        </div>

        <div className="export-grid" aria-label={text.downloads}>
          <a href="/exports/listings.json" download>
            <Download aria-hidden="true" />
            <span>
              <strong>{text.json}</strong>
              <small>{text.jsonNote}</small>
            </span>
          </a>
          <a href="/exports/listings.csv" download>
            <Download aria-hidden="true" />
            <span>
              <strong>{text.csv}</strong>
              <small>{text.csvNote}</small>
            </span>
          </a>
          {releases.length > 0 ? (
            <Link href="/releases/latest.json">
              <KeyRound aria-hidden="true" />
              <span>
                <strong>{text.latest}</strong>
                <small>{text.latestNote}</small>
              </span>
            </Link>
          ) : (
            <div className="export-unavailable">
              <KeyRound aria-hidden="true" />
              <span>
                <strong>{text.latest}</strong>
                <small>{text.latestPending}</small>
              </span>
            </div>
          )}
        </div>

        <section className="release-history" aria-labelledby="history-title">
          <div className="section-heading">
            <p className="eyebrow">{text.log}</p>
            <h2 id="history-title">{text.history}</h2>
          </div>
          {releases.length === 0 ? (
            <div className="release-empty">
              <FileClock size={28} aria-hidden="true" />
              <div>
                <h3>{text.emptyTitle}</h3>
                <p>{text.emptyNote}</p>
              </div>
            </div>
          ) : (
            <ol className="release-list">
              {releases.map((release) => (
                <li key={release.release_id}>
                  <div>
                    <h3>
                      {new Date(release.released_at).toISOString().slice(0, 10)}
                    </h3>
                    <p>
                      {release.listing_count} {text.entries} ·{' '}
                      {countChanges(release)} {text.changes} · {text.key}{' '}
                      {release.key_id}
                    </p>
                  </div>
                  <dl>
                    <div>
                      <dt>{text.added}</dt>
                      <dd>{release.changes.added.length}</dd>
                    </div>
                    <div>
                      <dt>{text.updated}</dt>
                      <dd>{release.changes.updated.length}</dd>
                    </div>
                    <div>
                      <dt>{text.removed}</dt>
                      <dd>{release.changes.removed.length}</dd>
                    </div>
                  </dl>
                  <a href={`/releases/${release.release_id}.json`}>
                    {text.view}
                  </a>
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>
    </main>
  );
}
