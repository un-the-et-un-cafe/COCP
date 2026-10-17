'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { CrossMark } from './marks';
import { TestnetBanner } from './testnet-banner';
import { isRtl, type Locale } from './use-locale';

/** Part 3 (sponsor) chrome: compact header, language select, TestnetBanner on every screen. */
export function P3Shell({ locale, setLocale, back, backLabel, children }: { locale: Locale; setLocale: (l: Locale) => void; back: string; backLabel: string; children: ReactNode }) {
  const dir = isRtl(locale) ? 'rtl' : 'ltr';
  return (
    <main className="sponsor-page p3-page" dir={dir} data-locale={locale}>
      <header className="site-header">
        <Link className="brand-block brand-home" href="/" aria-label="Calais Open Commons">
          <CrossMark />
          <p className="brand-name">Calais Open Commons</p>
        </Link>
        <div className="header-actions">
          <Link href={back} className="directory-link">
            {backLabel}
          </Link>
          <label className="language-control">
            <span className="sr-only">Langue / Language</span>
            <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
          </label>
        </div>
      </header>
      <TestnetBanner locale={locale} />
      <div className="p3-body">{children}</div>
    </main>
  );
}

/** "EUR → USDC" as a flow: each side is isolated and the arrow mirrors in RTL (CSS .flow-arrow),
 *  so an RTL page shows "USDC ← EUR" (read right to left, EUR first). */
export function Flow({ from, to }: { from: ReactNode; to: ReactNode }) {
  return (
    <>
      <bdi dir="ltr">{from}</bdi> <span className="flow-arrow">→</span> <bdi dir="ltr">{to}</bdi>
    </>
  );
}
export const flowParts = (label: string) => {
  const [a, b] = label.split('→').map((s) => s.trim());
  return b === undefined ? null : ([a, b] as const);
};
