'use client';

import '../../../secondary.css';
import { useEffect, useState } from 'react';
import rehearsal from '@/data/settlement-rehearsal.draft.json';
import reconciliation from '@/data/reconciliation/2026-10.sandbox.json';
import { Flow, flowParts, P3Shell } from '../../../p3-shell';
import { eur, p3Copy, parisDate, usdc } from '../../../p3-copy';
import { useLocale } from '../../../use-locale';

/** Settlement detail (screens.md P3 #5), static: /sponsors/ledger/batch/?id=<batch>. Batch,
 *  association, EUR → USDC and the reconciliation pill. No wallet address. The rehearsal rows are
 *  synthetic and their hash is not a Base Sepolia transaction (checked on the public explorer,
 *  2026-10-17), so no TxLink is rendered and the hash is never displayed. */
export default function BatchPage() {
  const [locale, setLocale] = useLocale();
  const { lang, d, x } = p3Copy(locale);
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setId(new URLSearchParams(window.location.search).get('id') ?? ''));
    return () => cancelAnimationFrame(frame);
  }, []);
  const conv = flowParts(x.conversion);
  const rows = rehearsal.rows.filter((r) => r.campaign_id === id);
  const period = rows[0]?.recorded_at.slice(0, 7);
  const rec = reconciliation.period === period ? reconciliation : null;
  return (
    <P3Shell locale={locale} setLocale={setLocale} back="/sponsors/ledger" backLabel={x.backLedger}>
      <h1>{x.batchTitle}</h1>
      {id === null ? null : rows.length === 0 ? (
        <p className="alert">{x.notFound}</p>
      ) : (
        <>
          {rows.some((r) => r.synthetic) ? <p className="alert">{x.synthetic}</p> : null}
          <p>
            {x.batch} <code dir="ltr">{id}</code>
          </p>
          {rec ? (
            <p>
              {x.reconciliation}{' '}
              <span className={rec.ok && rec.mismatches.length === 0 ? 'pill pill-ok' : 'pill pill-warn'}>{rec.ok && rec.mismatches.length === 0 ? x.recOk : x.recMismatch}</span>
            </p>
          ) : null}
          {rec && !(rec.ok && rec.mismatches.length === 0) ? <p className="alert">{d['ledger.mismatch']}</p> : null}
          {rows.map((r) => (
            <article className="p3-card" key={r.fiat_payment_ref}>
              <dl className="p3-dl">
                <dt>{x.association}</dt>
                <dd><code dir="ltr">{r.association_label}</code></dd>
                <dt>{d['receipt.date']}</dt>
                <dd><bdi dir="ltr">{parisDate(r.recorded_at, lang)}</bdi></dd>
                <dt>{conv ? <Flow from={conv[0]} to={conv[1]} /> : x.conversion}</dt>
                <dd><Flow from={eur(r.split_90_10.charity_eur_cents, lang)} to={usdc(r.usdc_amount_micro)} /></dd>
                <dt>{d['ledger.adminEur']}</dt>
                <dd><bdi dir="ltr">{eur(r.split_90_10.admin_eur_cents, lang)}</bdi></dd>
                <dt>{x.rate}</dt>
                <dd lang="en">{r.casp_note}</dd>
              </dl>
              <p className="freshness">{x.noTx}</p>
            </article>
          ))}
        </>
      )}
    </P3Shell>
  );
}
