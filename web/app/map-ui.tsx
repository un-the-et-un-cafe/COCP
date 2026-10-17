'use client';

import Link from 'next/link';
import { T } from './deck-text';
import type { Listing } from './listing-ui';
import type { Locale } from './use-locale';
import zonesMeta from '../data/zones-meta.json';

/** Map & text by area (screens.md "Part 1 · Map & text by area", v0.3.2–0.3.4).
 *  Zones come from web/data/zones.json (approximate boundaries from © OpenStreetMap contributors,
 *  ODbL; to be confirmed by Calais associations). No listing carries a `zone` yet (zones are
 *  assigned by an association), so listings stay under map.zoneUnassigned until then. */
/*  Names and order come from zones-meta.json (kept equal to zones.json by a test) so the list
 *  view does not download the geometry; zone-map.tsx (lazy, map view only) loads zones.json. */
export type ZoneMeta = { id: string; order: number; name: Record<string, string> };

export const ZONES: ZoneMeta[] = [...(zonesMeta.zones as ZoneMeta[])].sort((a, b) => a.order - b.order);
/** Zone names are data: fr source, en reference; untranslated languages fall back to en. */
export const zoneLabel = (z: ZoneMeta, locale: string) => {
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
