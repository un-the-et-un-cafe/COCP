'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import rehearsal from '@/data/settlement-rehearsal.draft.json';
import { P3Shell } from '../../p3-shell';
import { eur, p3Copy, parisDate } from '../../p3-copy';
import { SplitPreview } from '../../split-preview';
import { useLocale } from '../../use-locale';

/** Receipt (screens.md P3 #3), static: /sponsors/receipt/?ref=<fiat_payment_ref>. Only rows that
 *  exist in the synthetic rehearsal file can be shown; nothing is generated here. The refund window
 *  length is open ([OFFEN] in the deck), so no day count is shown, and no fiscal document is offered. */
export default function ReceiptPage() {
  const [locale, setLocale] = useLocale();
  const { lang, d, x } = p3Copy(locale);
  const [ref, setRef] = useState<string | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setRef(new URLSearchParams(window.location.search).get('ref') ?? ''));
    return () => cancelAnimationFrame(frame);
  }, []);
  const row = rehearsal.rows.find((r) => r.fiat_payment_ref === ref);
  return (
    <P3Shell locale={locale} setLocale={setLocale} back="/sponsors" backLabel={x.backSponsors}>
      <h1>{d['receipt.title']}</h1>
      {ref === null ? null : !row ? (
        <p className="alert">{x.notFound}</p>
      ) : (
        <>
          {row.synthetic ? <p className="alert">{x.synthetic}</p> : null}
          <dl className="p3-dl">
            <dt>{d['receipt.amount']}</dt>
            <dd><bdi dir="ltr">{eur(row.eur_amount_cents, lang)}</bdi></dd>
            <dt>{d['receipt.date']}</dt>
            <dd><bdi dir="ltr">{parisDate(row.recorded_at, lang)}</bdi></dd>
            <dt>{d['receipt.reference']}</dt>
            <dd><code dir="ltr">{row.fiat_payment_ref}</code></dd>
            <dt>{x.refundWindow}</dt>
            <dd>{row.refund_window_closed ? x.refundClosed : x.refundOpen}</dd>
          </dl>
          <SplitPreview locale={locale} amountCents={row.eur_amount_cents} />
          <p>{d['receipt.settlementNote']}</p>
          <p>
            <Link href={`/sponsors/ledger/batch/?id=${row.campaign_id}`}>{x.seeBatch}</Link>
          </p>
        </>
      )}
    </P3Shell>
  );
}
