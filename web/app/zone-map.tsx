'use client';

import { useEffect, useState } from 'react';
import { tr } from './deck';
import { T } from './deck-text';
import { OSM_ATTRIBUTION, ZONES as META, zoneLabel } from './map-ui';
import type { Locale } from './use-locale';
import zonesData from '../data/zones.json';

/** Map view only, loaded lazily by need-view (React.lazy) when view=map: zone geometry from
 *  web/data/zones.json (approximate, © OpenStreetMap contributors, ODbL), SVG, chips, tiles card. */
type ZoneData = { id: string; order: number; name: Record<string, string>; polygon: [number, number][] };
const data = zonesData as unknown as { source: string; zones: ZoneData[] };
type Zone = { id: string; name: Record<string, string>; order: number; d: string; cx: number; cy: number };

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
const MAP_H = Math.round((maxY - minY) * scale + 2 * PAD);
const px = (p: [number, number]) => [PAD + (p[0] * k - minX) * scale, MAP_H - PAD - (p[1] - minY) * scale] as const;

const ZONES: Zone[] = META.map((m) => {
  const z = data.zones.find((x) => x.id === m.id)!;
  const pts = z.polygon.slice(0, -1).map(px);
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return { ...m, d: `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`, cx, cy };
});

/** Inline SVG (dir=ltr, works offline): tap a zone to filter. Shapes are approximate. */
function ZoneMap({ locale, counts, zone, onZone, title }: { locale: Locale; counts: Record<string, number>; zone: string | null; onZone: (z: string | null) => void; title: string }) {
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

function ZoneChips({ locale, counts, zone, onZone }: { locale: Locale; counts: Record<string, number>; zone: string | null; onZone: (z: string | null) => void }) {
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
function TilesOptIn({ locale }: { locale: Locale }) {
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


export default function MapView({ locale, counts, zone, onZone, tiles }: { locale: Locale; counts: Record<string, number>; zone: string | null; onZone: (z: string | null) => void; tiles: boolean }) {
  return (
    <>
      <ZoneMap locale={locale} counts={counts} zone={zone} onZone={onZone} title={tr(locale, 'map.svgTitle')} />
      <ZoneChips locale={locale} counts={counts} zone={zone} onZone={onZone} />
      {Object.keys(counts).length === 0 ? (
        <p className="alert">
          <T locale={locale} k="map.empty" />
        </p>
      ) : null}
      {/* TilesOptIn stays hidden until a self-hosted tile set exists (QA N10). */}
      {tiles ? <TilesOptIn locale={locale} /> : null}
    </>
  );
}
