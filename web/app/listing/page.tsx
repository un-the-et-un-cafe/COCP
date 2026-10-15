'use client';

import { useEffect, useRef, useState } from 'react';
import listingsData from '../../data/listings.json';
import { FreshnessLine, OpenBadge, type Listing } from '../listing-ui';
import { p1Copy } from '../p1-copy';
import { P1Shell } from '../p1-shell';
import { useLocale } from '../use-locale';

const listings = listingsData as unknown as Listing[];
type Reason = 'closed' | 'hours' | 'moved' | 'other';
// Map the 4 sheet reasons onto the existing correction API types. The sheet has no text field;
// a fixed, non-personal message satisfies the API's minimum length.
const apiType: Record<Reason, string> = { closed: 'closed', hours: 'hours', moved: 'location', other: 'other' };

/** Listing detail (screens.md P1 #4) + Report-outdated sheet (#7), static: /listing/?id=<id>. */
export default function ListingPage() {
  const [locale, setLocale] = useLocale();
  const t = p1Copy[locale];
  const [id, setId] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [reason, setReason] = useState<Reason | ''>('');
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setId(new URLSearchParams(window.location.search).get('id') ?? '');
      setNow(Date.now());
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const listing = listings.find((l) => l.id === id);

  async function send() {
    if (!listing || !reason) return;
    setState('sending');
    try {
      const res = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id, reportType: apiType[reason], message: `Quick report: ${reason}`, language: locale, privacyConfirmed: true }),
      });
      setState(res.ok ? 'ok' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <P1Shell locale={locale} setLocale={setLocale} note={t.details}>
      {id === null ? null : !listing ? (
        <p className="empty-state">{t.notFound}</p>
      ) : (
        <article className="listing-detail">
          <h1>{listing.name}</h1>
          <OpenBadge t={t} />
          <div className="detail-actions">
            {listing.location.map_url ? (
              <a className="btn-2" href={listing.location.map_url} target="_blank" rel="noreferrer">
                {t.map}
              </a>
            ) : null}
          </div>
          <section>
            <h2>{t.what}</h2>
            <p>{listing.source.notes}</p>
          </section>
          <section>
            <h2>{t.when}</h2>
            <p>{t.hoursUnknown}</p>
          </section>
          <section>
            <h2>{t.where}</h2>
            <p>
              <bdi dir="ltr">{listing.location.label}</bdi>
            </p>
          </section>
          <section>
            <h2>{t.who}</h2>
            <p>{listing.audience.includes('all') ? t.whoAll : listing.audience.join(', ')}</p>
          </section>
          <FreshnessLine listing={listing} t={t} now={now} />
          <button type="button" className="btn-2" onClick={() => dialog.current?.showModal()}>
            {t.reportButton}
          </button>
          <dialog ref={dialog} className="report-sheet" aria-labelledby="report-title">
            <form method="dialog" onSubmit={(e) => { e.preventDefault(); void send(); }}>
              <h2 id="report-title">{t.reportTitle}</h2>
              {state === 'ok' ? (
                <output className="alert">{t.success}</output>
              ) : (
                <>
                  <fieldset className="reason-list">
                    <legend className="sr-only">{t.reportTitle}</legend>
                    {(Object.keys(t.reasons) as Reason[]).map((r) => (
                      <label key={r}>
                        <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} /> {t.reasons[r]}
                      </label>
                    ))}
                  </fieldset>
                  {state === 'error' ? <p className="alert warn" role="alert">{t.error}</p> : null}
                  <button className="btn" type="submit" aria-disabled={!reason || state === 'sending'} disabled={!reason || state === 'sending'} aria-busy={state === 'sending'}>
                    {state === 'sending' ? t.sending : t.submit}
                  </button>
                </>
              )}
              <button type="button" className="btn-2" onClick={() => dialog.current?.close()}>
                {t.close}
              </button>
            </form>
          </dialog>
        </article>
      )}
    </P1Shell>
  );
}
