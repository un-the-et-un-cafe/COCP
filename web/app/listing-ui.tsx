'use client';

import { useEffect, useState } from 'react';
import type { P1Copy } from './p1-copy';

export type Listing = {
  id: string;
  name: string;
  categories: string[];
  audience: string[];
  location: { label: string; map_url?: string; coordinates?: [number, number] };
  source: { page: number; notes: string; title: string };
  verification: { status: string; checked_at: string | null; expires_at: string | null; owner: string | null };
};

/** OpenBadge: the data has no confirmed opening hours yet, so we never claim "open". */
export function OpenBadge({ t }: { t: P1Copy }) {
  return <span className="pill">{t.hoursUnknown}</span>;
}

/** FreshnessLine: verified → "Checked by … on …"; >30d amber chip; >90d warning. */
export function FreshnessLine({ listing, t, now }: { listing: Listing; t: P1Copy; now: number }) {
  const v = listing.verification;
  if (v.status !== 'verified' || !v.checked_at) {
    return <p className="freshness stale">{t.unverified(listing.source.page)}</p>;
  }
  const days = now ? (now - Date.parse(v.checked_at)) / 864e5 : 0;
  return (
    <p className={`freshness${days > 30 ? ' stale' : ''}`}>
      {t.verified(v.owner ?? '—', v.checked_at.slice(0, 10))}
      {days > 90 ? <strong> · {t.stale90}</strong> : days > 30 ? <span className="pill refunded"> {t.stale30}</span> : null}
    </p>
  );
}

/** Offline banner: shown only when the browser reports it is offline. */
export function OfflineBanner({ t, date }: { t: P1Copy; date: string }) {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  if (!offline) return null;
  return (
    <output className="alert warn offline-banner">{t.offline(date)}</output>
  );
}

const paths: Record<string, string> = {
  all: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  emergency: 'M12 3 2 21h20L12 3zm0 6v6m0 3v.5',
  food: 'M7 3v8m-3-8v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-2 6 0 8v10',
  showers: 'M4 20V8a4 4 0 0 1 8 0M9 10h6M11 14v1m3-1v1m3-1v1m-6 3v1m3-1v1m3-1v1',
  water: 'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z',
  healthcare: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  community: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 3-5 6-5s6 2 6 5m0-5c3 0 8 1 8 5',
  legal: 'M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zm14 0-3 7a3 3 0 0 0 6 0zM8 21h8',
};
export function NeedIcon({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[id] ?? paths.all} />
    </svg>
  );
}
