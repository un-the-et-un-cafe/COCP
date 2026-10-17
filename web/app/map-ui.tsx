'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { T } from './deck-text';
import type { Listing } from './listing-ui';
import type { Locale } from './use-locale';

/** Map & text by area (screens.md "Part 1 · Map & text by area", v0.3.2/0.3.3).
 *  There is no web/data/zones.json yet and no listing carries a `zone` (zones are assigned by an
 *  association), so the six zones are PLACEHOLDERS: names "[zone A]"…"[zone F]" and schematic
 *  shapes (not geography). Unassigned listings are listed under a placeholder group. */
export type Zone = { id: string; name: string; d: string; cx: number; cy: number };
export const ZONES: Zone[] = [
  { id: 'A', name: '[zone A]', d: 'M8 10H112L106 72H8Z', cx: 58, cy: 46 },
  { id: 'B', name: '[zone B]', d: 'M112 10H212L218 72H106Z', cx: 162, cy: 46 },
  { id: 'C', name: '[zone C]', d: 'M212 10H320V82L218 72Z', cx: 268, cy: 46 },
  { id: 'D', name: '[zone D]', d: 'M8 72H106L112 140H8Z', cx: 58, cy: 108 },
  { id: 'E', name: '[zone E]', d: 'M106 72H218L224 140H112Z', cx: 166, cy: 108 },
  { id: 'F', name: '[zone F]', d: 'M218 72L320 82V140H224Z', cx: 272, cy: 112 },
];
export const UNASSIGNED = '[copy: map.zoneUnassigned]';
export const zoneOf = (l: Listing) => (l as Listing & { zone?: string }).zone ?? null;

export function ViewSwitch({ locale, view, onChange }: { locale: Locale; view: 'area' | 'map'; onChange: (v: 'area' | 'map') => void }) {
  return (
    <fieldset className="view-switch">
      <legend className="sr-only">[copy: map.viewSwitch]</legend>
      {(['area', 'map'] as const).map((v) => (
        <label key={v}>
          <input type="radio" name="view" value={v} checked={view === v} onChange={() => onChange(v)} />
          <span>{v === 'area' ? <T locale={locale} k="map.textTitle" /> : <T locale={locale} k="map.viewMap" />}</span>
        </label>
      ))}
    </fieldset>
  );
}

/** Inline SVG (dir=ltr, works offline, < 2 KB): tap a zone to filter. Shapes are schematic. */
export function ZoneMap({ locale, counts, zone, onZone, title }: { locale: Locale; counts: Record<string, number>; zone: string | null; onZone: (z: string | null) => void; title: string }) {
  return (
    <figure className="zone-map" dir="ltr">
      <svg viewBox="0 0 328 150" aria-labelledby="zone-map-title">
        <title id="zone-map-title">{title}</title>
        {ZONES.map((z) => (
          // Keyboard and screen-reader users use the ZoneChips below; the shapes are a pointer shortcut.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <g key={z.id} className={zone === z.id ? 'zone on' : 'zone'} onClick={() => onZone(zone === z.id ? null : z.id)}>
            <path d={z.d} />
            <text x={z.cx} y={z.cy - 12} textAnchor="middle" className="zone-name">{z.name}</text>
            <circle cx={z.cx} cy={z.cy + 6} r="11" />
            <text x={z.cx} y={z.cy + 10} textAnchor="middle" className="zone-count">{counts[z.id] ?? 0}</text>
          </g>
        ))}
      </svg>
      <figcaption className="sr-only" lang={locale}>{title}</figcaption>
    </figure>
  );
}

export function ZoneChips({ locale, counts, zone, onZone }: { locale: Locale; counts: Record<string, number>; zone: string | null; onZone: (z: string | null) => void }) {
  return (
    <div className="zone-chips">
      <button type="button" aria-pressed={zone === null} onClick={() => onZone(null)}>
        <T locale={locale} k="map.zoneAll" />
      </button>
      {ZONES.map((z) => (
        <button type="button" key={z.id} aria-pressed={zone === z.id} onClick={() => onZone(z.id)}>
          {z.name} <bdi dir="ltr">{counts[z.id] ?? 0}</bdi>
        </button>
      ))}
    </div>
  );
}

/** Opt-in detailed map. Tiles would come only from /tiles/ on this origin and only after the tap;
 *  no tile set is published yet, so Load stays disabled (placeholder) and nothing is requested. */
export function TilesOptIn({ locale }: { locale: Locale }) {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const u = () => setOnline(navigator.onLine);
    const frame = requestAnimationFrame(u);
    window.addEventListener('online', u);
    window.addEventListener('offline', u);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('online', u);
      window.removeEventListener('offline', u);
    };
  }, []);
  return (
    <section className="tiles-optin">
      <h2>
        <T locale={locale} k="map.tilesOptIn" />
      </h2>
      <p>
        <T locale={locale} k="map.tilesDataCost" vars={{ size: '[size]' }} />
      </p>
      <button type="button" className="btn-2" disabled>
        <T locale={locale} k="map.tilesLoad" />
      </button>
      <p className="freshness">{online ? '[copy: map.tilesUnavailable]' : <T locale={locale} k="map.tilesOffline" />}</p>
    </section>
  );
}

export function AreaRow({ listing, children }: { listing: Listing; children?: React.ReactNode }) {
  return (
    <li className="area-row">
      <div>
        <p className="area-name">{listing.name}</p>
        {children}
      </div>
      <Link className="area-go" href={`/listing/?id=${listing.id}`} aria-label={listing.name}>
        <span aria-hidden="true" className="area-arrow">→</span>
      </Link>
    </li>
  );
}
