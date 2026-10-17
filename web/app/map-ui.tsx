'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { tr } from './deck';
import { T } from './deck-text';
import type { Listing } from './listing-ui';
import type { Locale } from './use-locale';
import zonesData from '../data/zones.json';

/** Map & text by area (screens.md "Part 1 · Map & text by area", v0.3.2–0.3.4).
 *  Zones come from web/data/zones.json (approximate boundaries from © OpenStreetMap contributors,
 *  ODbL; to be confirmed by Calais associations). No listing carries a `zone` yet (zones are
 *  assigned by an association), so listings stay under map.zoneUnassigned until then. */
type ZoneData = { id: string; order: number; name: Record<string, string>; polygon: [number, number][] };
const data = zonesData as unknown as { source: string; zones: ZoneData[] };
export type Zone = { id: string; name: Record<string, string>; d: string; cx: number; cy: number };

// Local equirectangular projection of the zone rings into the SVG viewBox (north up).
const W = 328;
const all = data.zones.flatMap((z) => z.polygon);
const k = Math.cos((50.95 * Math.PI) / 180);
const minX = Math.min(...all.map((p) => p[0])) * k;
const maxX = Math.max(...all.map((p) => p[0])) * k;
const minY = Math.min(...all.map((p) => p[1]));
const maxY = Math.max(...all.map((p) => p[1]));
const PAD = 6;
const scale = (W - 2 * PAD) / (maxX - minX);
export const MAP_H = Math.round((maxY - minY) * scale + 2 * PAD);
const px = (p: [number, number]) => [PAD + (p[0] * k - minX) * scale, MAP_H - PAD - (p[1] - minY) * scale] as const;

export const ZONES: Zone[] = [...data.zones]
  .sort((a, b) => a.order - b.order)
  .map((z) => {
    const pts = z.polygon.slice(0, -1).map(px);
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    return { id: z.id, name: z.name, d: `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`, cx, cy };
  });
/** Zone names are data: fr source, en reference; untranslated languages fall back to en. */
export const zoneLabel = (z: Zone, locale: string) => {
  const v = z.name[locale];
  return v && !v.startsWith('TODO') ? v : z.name.en;
};
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors, ODbL';
export const UNASSIGNED = 'unassigned';
export const zoneOf = (l: Listing) => (l as Listing & { zone?: string }).zone ?? null;

export function ViewSwitch({ locale, view, onChange }: { locale: Locale; view: 'area' | 'map'; onChange: (v: 'area' | 'map') => void }) {
  return (
    <fieldset className="view-switch">
      <legend className="sr-only">
        <T locale={locale} k="map.viewSwitch" />
      </legend>
      {(['area', 'map'] as const).map((v) => (
        <label key={v}>
          <input type="radio" name="view" value={v} checked={view === v} onChange={() => onChange(v)} />
          <span>{v === 'area' ? <T locale={locale} k="map.viewList" /> : <T locale={locale} k="map.viewMap" />}</span>
        </label>
      ))}
    </fieldset>
  );
}

/** Inline SVG (dir=ltr, works offline): tap a zone to filter. Shapes are approximate. */
export function ZoneMap({ locale, counts, zone, onZone, title }: { locale: Locale; counts: Record<string, number>; zone: string | null; onZone: (z: string | null) => void; title: string }) {
  const lang = locale === 'fr' ? 'fr' : 'en';
  return (
    <figure className="zone-map" dir="ltr">
      <svg viewBox={`0 0 ${W} ${MAP_H}`} aria-labelledby="zone-map-title">
        <title id="zone-map-title">{title}</title>
        {ZONES.map((z) => (
          // Keyboard and screen-reader users use the ZoneChips below; the shapes are a pointer shortcut.
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <g key={z.id} className={zone === z.id ? 'zone on' : 'zone'} onClick={() => onZone(zone === z.id ? null : z.id)}>
            <path d={z.d} />
            <text x={z.cx} y={counts[z.id] ? z.cy - 16 : z.cy + 4} textAnchor="middle" className="zone-name">{z.id}</text>
            {counts[z.id] ? (
              <>
                <circle cx={z.cx} cy={z.cy} r="12" />
                <text x={z.cx} y={z.cy + 4} textAnchor="middle" className="zone-count">{counts[z.id]}</text>
              </>
            ) : null}
          </g>
        ))}
      </svg>
      <ul className="zone-legend">
        {ZONES.map((z) => (
          <li key={z.id}>
            <b>{z.id}</b> <bdi dir="auto">{zoneLabel(z, locale)}</bdi>
          </li>
        ))}
      </ul>
      <figcaption className="freshness" dir="auto">
        <span lang={lang}>{tr(lang, 'map.approxNote')}</span> <span lang="en">{OSM_ATTRIBUTION}</span>
      </figcaption>
    </figure>
  );
}

export function ZoneChips({ locale, counts, zone, onZone }: { locale: Locale; counts: Record<string, number>; zone: string | null; onZone: (z: string | null) => void }) {
  // Zones with no listing get no chip (QA N3); with no zone data at all there are no chips.
  const shown = ZONES.filter((z) => counts[z.id]);
  if (shown.length === 0) return null;
  return (
    <div className="zone-chips">
      <button type="button" aria-pressed={zone === null} onClick={() => onZone(null)}>
        <T locale={locale} k="map.zoneAll" />
      </button>
      {shown.map((z) => (
        <button type="button" key={z.id} aria-pressed={zone === z.id} onClick={() => onZone(z.id)}>
          {z.id} · {zoneLabel(z, locale)} <bdi dir="ltr">{counts[z.id] ?? 0}</bdi>
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
      <p className="freshness"><T locale={locale} k={online ? 'map.tilesUnavailable' : 'map.tilesOffline'} /></p>
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
