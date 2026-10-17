'use client';

import { useEffect, useMemo, useState } from 'react';
import listingsData from '../data/listings.json';
import fr from '../locales/fr.json';
import en from '../locales/en.json';
import ar from '../locales/ar.json';
import { tr } from './deck';
import { T } from './deck-text';
import { FreshnessLine, NeedIcon, OpenBadge, type Listing } from './listing-ui';
import { AreaRow, TilesOptIn, UNASSIGNED, ViewSwitch, ZONES, ZoneChips, ZoneMap, zoneOf } from './map-ui';
import { p1Copy } from './p1-copy';
import { P1Shell } from './p1-shell';
import { PhoneIcon } from './marks';
import { useLocale, type Locale } from './use-locale';

const listings = listingsData as unknown as Listing[];
const names: Record<Locale, Record<string, string>> = { fr: fr.categories, en: en.categories, ar: ar.categories };

function distanceM(a: [number, number], b: [number, number]) {
  const r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r;
  const dLon = (b[0] - a[0]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);
const isCoords = (s: string) => /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(s) || s.includes(' / ');

/** need/[id] (screens.md P1 #3 + "Map & text by area"), static: /need/?id=&view=area|map&zone=.
 *  Location is read once, only after the toggle, kept in memory on this device, never sent or
 *  stored. The zone is mirrored to the URL (?zone=) with no storage. */
export function NeedView() {
  const [locale, setLocale] = useLocale();
  const t = p1Copy[locale];
  const [id, setId] = useState('all');
  const [view, setView] = useState<'area' | 'map'>('area');
  const [zone, setZone] = useState<string | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const [useLoc, setUseLoc] = useState(false);
  const [here, setHere] = useState<[number, number] | null>(null);
  const [denied, setDenied] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const q = new URLSearchParams(window.location.search);
      setId(q.get('id') ?? 'all');
      if (q.get('view') === 'map') setView('map');
      const z = q.get('zone');
      if (z && ZONES.some((x) => x.id === z)) setZone(z);
      setNow(Date.now());
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function sync(next: { view?: 'area' | 'map'; zone?: string | null }) {
    const q = new URLSearchParams(window.location.search);
    const v = next.view ?? view;
    const z = next.zone === undefined ? zone : next.zone;
    if (v === 'map') q.set('view', 'map');
    else q.delete('view');
    if (z) q.set('zone', z);
    else q.delete('zone');
    history.replaceState(null, '', `?${q.toString()}`);
    if (next.view) setView(next.view);
    if (next.zone !== undefined) setZone(next.zone);
  }

  function toggleLocation(on: boolean) {
    setUseLoc(on);
    setDenied(false);
    if (!on) return setHere(null);
    if (!('geolocation' in navigator)) return setDenied(true);
    navigator.geolocation.getCurrentPosition(
      (p) => setHere([p.coords.longitude, p.coords.latitude]),
      () => {
        setDenied(true);
        setUseLoc(false);
      },
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

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of items) {
      const z = zoneOf(l);
      if (z) c[z] = (c[z] ?? 0) + 1;
    }
    return c;
  }, [items]);

  // Zones in fixed geographic order; unassigned last. With location on, zones by nearest listing.
  const groups = useMemo(() => {
    const keys = [...ZONES.map((z) => z.id), UNASSIGNED];
    const g = keys.map((k) => ({ k, ls: items.filter((l) => (zoneOf(l) ?? UNASSIGNED) === k) })).filter((x) => x.ls.length);
    if (here) {
      const near = (ls: Listing[]) => Math.min(...ls.map((l) => (l.location.coordinates ? distanceM(here, l.location.coordinates) : Infinity)));
      g.sort((a, b) => near(a.ls) - near(b.ls));
    }
    return zone ? g.filter((x) => x.k === zone) : g;
  }, [items, here, zone]);

  const title = names[locale][id] ?? id;
  const zoneName = (k: string) => ZONES.find((z) => z.id === k)?.name ?? k;

  return (
    <P1Shell locale={locale} setLocale={setLocale} note={title}>
      <h1 className="need-heading">
        <NeedIcon id={id} /> {title}
      </h1>
      <ViewSwitch locale={locale} view={view} onChange={(v) => sync({ view: v })} />
      <div className="toggle-row">
        <label className="switch">
          <span>
            <T locale={locale} k="toggle.location" />
          </span>
          <input type="checkbox" role="switch" aria-checked={useLoc} checked={useLoc} onChange={(e) => toggleLocation(e.target.checked)} />
        </label>
        <label className="switch">
          <span>{t.toggleOpenNow}</span>
          <input type="checkbox" role="switch" aria-checked={openNow} checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} />
        </label>
      </div>
      <p className="freshness">
        <T locale={locale} k={here ? 'map.nearestFirst' : 'toggle.locationNote'} />
      </p>
      {denied ? (
        <p className="alert">
          <T locale={locale} k="location.denied" />
        </p>
      ) : null}
      {openNow ? <p className="alert">{t.openNowNoHours}</p> : null}
      {view === 'map' ? (
        <>
          <ZoneMap locale={locale} counts={counts} zone={zone} onZone={(z) => sync({ zone: z })} title={tr(locale, 'map.svgTitle')} />
          <ZoneChips locale={locale} counts={counts} zone={zone} onZone={(z) => sync({ zone: z })} />
          <TilesOptIn locale={locale} />
        </>
      ) : null}
      {items.length === 0 ? (
        <div className="empty-state">
          <p>{t.listEmpty}</p>
          <a className="call-btn" href="tel:115">
            <PhoneIcon /> <bdi dir="ltr">115</bdi>
          </a>
        </div>
      ) : groups.length === 0 ? (
        <p className="alert">
          <T locale={locale} k="map.empty" />
        </p>
      ) : (
        <div className="area-groups">
          {groups.map(({ k, ls }) => (
            <section key={k} aria-labelledby={`zone-${k}`}>
              <div className="area-head">
                <h2 className="area-title" id={`zone-${k}`}>
                  {zoneName(k)}
                </h2>
                <span className="freshness">
                  <T locale={locale} k="map.zoneCount" count={ls.length} />
                </span>
              </div>
              <ul className="area-list">
                {ls.map((l) => (
                  <AreaRow key={l.id} listing={l}>
                    {!isCoords(l.location.label) ? <p className="freshness"><bdi>{l.location.label}</bdi></p> : null}
                    {here && l.location.coordinates ? (
                      <p className="distance">
                        <T locale={locale} k="map.distance" vars={{ distance: fmtDist(distanceM(here, l.location.coordinates)) }} />
                      </p>
                    ) : null}
                    <OpenBadge t={t} />
                    <FreshnessLine listing={l} t={t} now={now} />
                  </AreaRow>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </P1Shell>
  );
}
