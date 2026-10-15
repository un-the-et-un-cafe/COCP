'use client';

import Link from 'next/link';
import { Languages } from 'lucide-react';
import { EmergencyStrip } from './emergency-strip';
import { OfflineBanner } from './listing-ui';
import { p1Copy } from './p1-copy';
import { isRtl, type Locale } from './use-locale';

/** Data snapshot label for the offline banner (source guide edition; no release published yet). */
export const dataDate: Record<Locale, string> = { fr: 'août 2026', en: 'August 2026', ar: 'August 2026' };

export function P1Shell({ locale, setLocale, note, children }: { locale: Locale; setLocale: (l: Locale) => void; note: string; children: React.ReactNode }) {
  const t = p1Copy[locale];
  return (
    <main className="privacy-page p1-page" dir={isRtl(locale) ? 'rtl' : 'ltr'}>
      <header className="site-header">
        <Link className="brand-block brand-home" href="/" aria-label="Calais">
          <span className="brand-mark" aria-hidden="true">C</span>
          <div>
            <p className="brand-name">Calais Open Commons</p>
            <p className="brand-note">{note}</p>
          </div>
        </Link>
        <div className="header-actions">
          <label className="language-control">
            <Languages size={19} aria-hidden="true" />
            <span className="sr-only">Langue / Language</span>
            <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </label>
        </div>
      </header>
      <EmergencyStrip locale={locale} />
      <OfflineBanner t={t} date={dataDate[locale]} />
      <div className="privacy-shell p1-body">{children}</div>
    </main>
  );
}
