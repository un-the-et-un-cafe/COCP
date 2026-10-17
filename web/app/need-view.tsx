'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import listingsData from '../data/listings.json';
import fr from '../locales/fr.json';
import en from '../locales/en.json';
import ar from '../locales/ar.json';
import deck from './deck.json';
import { FreshnessLine, NeedIcon, OpenBadge, type Listing } from './listing-ui';
import { p1Copy } from './p1-copy';
import { P1Shell } from './p1-shell';
import { PhoneIcon } from './marks';
import { useLocale, type Locale } from './use-locale';

const listings = listingsData as unknown as Listing[];
const names: Record<Locale, Record<string, string>> = { fr: fr.categories, en: en.categories, ar: ar.categories };
export type View = 'list' | 'area' | 'map';

/* Labels not in Copy Deck v0.3.2 (view-switch names, zone/unplaced labels, map note):
 * written for FR/EN only, pending Whitey's review; ar falls back to en. */
const extra = {
  fr: { list: 'Liste', views: 'Affichage', zone: 'Zone', unplaced: 'Position à confirmer', mapNote: 'Plan simplifié sans fond de carte : positions relatives seulement, aucune requête externe.', unmapped: (n: number) => `${n} lieu(x) sans position exacte : voir la liste.` },
  en: { list: 'List', views: 'View', zone: 'Zone', unplaced: 'Location to be confirmed', mapNote: 'Simplified plan without a base map: relative positions only, no external requests.', unmapped: (n: number) => `${n} place(s) without an exact position: see the list.` },
};

function distanceM(a: [number, number], b: [number, number]) {
  const r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r;
  const dLon = (b[0] - a[0]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);
/** ~1 km cells derived from the listing's own coordinates (no invented area names). */
const cell = (c: [number, number]) => `${(Math.round(c[1] * 50) / 50).toFixed(2)} N, ${(Math.round(c[0] * 50) / 50).toFixed(2)} E`;

/** need/[id] (screens.md P1 #3) and map / text fallback (#5), static. Location is read once,
 *  only after the toggle, kept in memory on this device and never sent or stored. */
export function NeedView({ defaultView, fixedId }: { defaultView: View; fixedId?: string }) {
  const [locale, setLocale] = useLocale();
  const t = p1Copy[locale];
  const lang = locale === 'fr' ? 'fr' : 'en';
  const d = deck[lang];
  const x = extra[lang];
  const [id, setId] = useState(fixedId ?? 'all');
  const [view, setView] = useState<View>(defaultView);
  const [openNow, setOpenNow] = useState(false);
  const [useLoc, setUseLoc] = useState(false);
  const [here, setHere] = useState<[number, number] | null>(null);
  const [denied, setDenied] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const q = new URLSearchParams(window.location.search);
      if (!fixedId) setId(q.get('id') ?? 'all');
      const v = q.get('view');
      if (v === 'list' || v === 'area' || v === 'map') setView(v);
      setNow(Date.now());
    });
    return () => cancelAnimationFrame(frame);
  }, [fixedId]);

  function toggleLocation(on: boolean) {
    setUseLoc(on);
    setDenied(false);
    if (!on) {
      setHere(null);
      return;
    }
    if (!('geolocation' in navigator)) {
      setDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setHere([p.coords.longitude, p.coords.latitude]),
      () => setDenied(true),
      { maximumAge: 300000, timeout: 15000 },
    );
  }

  const items = useMemo(() => {
    const list = listings.filter((l) => id === 'all' || l.categories.includes(id));
    // Order: open now → distance (if opted in) → freshness. No sponsor criteria. No hours data yet.
    const fresh = (l: Listing) => Number(l.verification.status === 'verified');
    const dist = (l: Listing) => (here && l.location.coordinates ? distanceM(here, l.location.coordinates) : Infinity);
    const sorted = [...list].sort((a, b) => (here ? dist(a) - dist(b) : 0) || fresh(b) - fresh(a));
    return openNow ? [] : sorted;
  }, [id, openNow, here]);

  const groups = useMemo(() => {
    const g = new Map<string, Listing[]>();
    for (const l of items) {
      const k = l.location.coordinates ? `${x.zone} ≈ ${cell(l.location.coordinates)}` : x.unplaced;
      g.set(k, [...(g.get(k) ?? []), l]);
    }
    return [...g.entries()].sort((a, b) => Number(a[0] === x.unplaced) - Number(b[0] === x.unplaced));
  }, [items, x]);

  const title = names[locale][id] ?? id;
  const card = (l: Listing) => (
    <article className="listing-card" key={l.id}>
      <h3>
        <Link href={`/listing/?id=${l.id}`}>{l.name}</Link>
      </h3>
      <OpenBadge t={t} />
      {here && l.location.coordinates ? (
        <p className="distance">
          <bdi dir="ltr">{fmtDist(distanceM(here, l.location.coordinates))}</bdi>
        </p>
      ) : null}
      {view === 'area' ? <p className="freshness"><bdi>{l.location.label}</bdi></p> : null}
      <FreshnessLine listing={l} t={t} now={now} />
    </article>
  );
  const placed = items.filter((l) => l.location.coordinates);

  return (
    <P1Shell locale={locale} setLocale={setLocale} note={title}>
      <h1 className="need-heading">
        <NeedIcon id={id} /> {title}
      </h1>
      <div className="toggle-row">
        <label className="switch">
          <span>{t.toggleOpenNow}</span>
          <input type="checkbox" role="switch" aria-checked={openNow} checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} />
        </label>
        <label className="switch">
          <span>{d['toggle.location']}</span>
          <input type="checkbox" role="switch" aria-checked={useLoc} checked={useLoc} onChange={(e) => toggleLocation(e.target.checked)} />
        </label>
      </div>
      <p className="freshness">{d['toggle.locationNote']}</p>
      {denied ? <p className="alert">{d['location.denied']}</p> : null}
      <fieldset className="view-switch">
        <legend className="sr-only">{x.views}</legend>
        {(['list', 'area', 'map'] as const).map((v) => (
          <label key={v}>
            <input type="radio" name="view" value={v} checked={view === v} onChange={() => setView(v)} />
            <span>{v === 'list' ? x.list : v === 'area' ? d['map.textTitle'] : t.map}</span>
          </label>
        ))}
      </fieldset>
      {openNow ? <p className="alert">{t.openNowNoHours}</p> : null}
      {items.length === 0 ? (
        <div className="empty-state">
          <p>{view === 'map' ? d['map.empty'] : t.listEmpty}</p>
          <a className="call-btn" href="tel:115">
            <PhoneIcon /> <bdi dir="ltr">115</bdi>
          </a>
        </div>
      ) : view === 'list' ? (
        <div className="listing-stack">{items.map(card)}</div>
      ) : view === 'area' ? (
        <div className="area-groups">
          {groups.map(([k, ls]) => (
            <section key={k} aria-label={k}>
              <h2 className="area-title">
                <bdi>{k}</bdi>
              </h2>
              <div className="listing-stack">{ls.map(card)}</div>
            </section>
          ))}
        </div>
      ) : (
        <MapPlan items={placed} here={here} note={x.mapNote} empty={d['map.empty']} unmapped={items.length - placed.length ? x.unmapped(items.length - placed.length) : ''} />
      )}
    </P1Shell>
  );
}

/** Pins (decorative; the legend below carries the links) projected from the listings' own coordinates onto a plain SVG (no tiles, no third-party
 *  requests). North is up; scale is local equirectangular. */
function MapPlan({ items, here, note, empty, unmapped }: { items: Listing[]; here: [number, number] | null; note: string; empty: string; unmapped: string }) {
  if (items.length === 0) return <p className="alert">{empty}</p>;
  const pts = items.map((l) => l.location.coordinates as [number, number]);
  if (here) pts.push(here);
  const lons = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  const k = Math.cos((50.95 * Math.PI) / 180);
  const minX = Math.min(...lons) * k, maxX = Math.max(...lons) * k, minY = Math.min(...lats), maxY = Math.max(...lats);
  const W = 320, H = 240, pad = 20;
  const s = Math.min((W - 2 * pad) / (maxX - minX || 1), (H - 2 * pad) / (maxY - minY || 1));
  const px = (c: [number, number]) => [pad + (c[0] * k - minX) * s, H - pad - (c[1] - minY) * s];
  return (
    <figure className="map-plan">
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <rect x="0" y="0" width={W} height={H} rx="12" className="map-bg" />
        {items.map((l) => {
          const [cx, cy] = px(l.location.coordinates as [number, number]);
          return (
            <circle key={l.id} cx={cx} cy={cy} r="9" className="map-pin" />
          );
        })}
        {here ? <circle cx={px(here)[0]} cy={px(here)[1]} r="6" className="map-here" /> : null}
      </svg>
      <figcaption className="freshness">
        {note} {unmapped}
      </figcaption>
      <ul className="map-legend">
        {items.map((l) => (
          <li key={l.id}>
            <Link href={`/listing/?id=${l.id}`}>{l.name}</Link>
          </li>
        ))}
      </ul>
    </figure>
  );
}
