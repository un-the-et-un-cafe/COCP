'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import listingsData from '../../data/listings.json';
import fr from '../../locales/fr.json';
import en from '../../locales/en.json';
import ar from '../../locales/ar.json';
import { FreshnessLine, NeedIcon, OpenBadge, type Listing } from '../listing-ui';
import { p1Copy } from '../p1-copy';
import { P1Shell } from '../p1-shell';
import { PhoneIcon } from '../marks';
import { useLocale, type Locale } from '../use-locale';

const listings = listingsData as unknown as Listing[];
const names: Record<Locale, Record<string, string>> = { fr: fr.categories, en: en.categories, ar: ar.categories };

/** need/[id] (screens.md P1 #3) as a static page: /need/?id=<category>. */
export default function NeedPage() {
  const [locale, setLocale] = useLocale();
  const t = p1Copy[locale];
  const [id, setId] = useState('all');
  const [openNow, setOpenNow] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setId(new URLSearchParams(window.location.search).get('id') ?? 'all');
      setNow(Date.now());
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const items = useMemo(() => {
    const list = listings.filter((l) => id === 'all' || l.categories.includes(id));
    // Order: open now → freshness. No sponsor criteria. No listing has confirmed hours yet.
    const sorted = [...list].sort((a, b) => Number(b.verification.status === 'verified') - Number(a.verification.status === 'verified'));
    return openNow ? [] : sorted;
  }, [id, openNow]);
  const title = names[locale][id] ?? id;
  return (
    <P1Shell locale={locale} setLocale={setLocale} note={title}>
      <h1 className="need-heading">
        <NeedIcon id={id} /> {title}
      </h1>
      <label className="switch">
        <span>{t.toggleOpenNow}</span>
        <input type="checkbox" role="switch" aria-checked={openNow} checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} />
      </label>
      {openNow ? <p className="alert">{t.openNowNoHours}</p> : null}
      {items.length === 0 ? (
        <div className="empty-state">
          <p>{t.listEmpty}</p>
          <a className="call-btn" href="tel:115">
            <PhoneIcon /> <bdi dir="ltr">115</bdi>
          </a>
        </div>
      ) : (
        <div className="listing-stack">
          {items.map((l) => (
            <article className="listing-card" key={l.id}>
              <h2>
                <Link href={`/listing/?id=${l.id}`}>{l.name}</Link>
              </h2>
              <OpenBadge t={t} />
              <FreshnessLine listing={l} t={t} now={now} />
            </article>
          ))}
        </div>
      )}
    </P1Shell>
  );
}
