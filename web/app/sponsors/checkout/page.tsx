'use client';

import Link from 'next/link';
import { useState } from 'react';
import packagesData from '@/data/sponsor-packages.json';
import flags from '@/data/feature-flags.json';
import { P3Shell } from '../../p3-shell';
import { eur, p3Copy } from '../../p3-copy';
import { SplitPreview } from '../../split-preview';
import { useLocale } from '../../use-locale';

const packages = packagesData.packages;
const testCheckout = flags.flags.payments_card_testmode_ui || flags.flags.payments_sepa_testmode_ui;
const SAMPLE_REF = 'SYN-CARD-20261005-0001';

/** Checkout (screens.md P3 #2). Sandbox only: no Stripe JS is loaded while the test-mode flags
 *  are off (they are), so Pay stays disabled and no payment can be started. */
export default function CheckoutPage() {
  const [locale, setLocale] = useLocale();
  const { lang, d, x } = p3Copy(locale);
  const [pkg, setPkg] = useState(packages[0].package_id);
  const [showName, setShowName] = useState(false);
  const chosen = packages.find((p) => p.package_id === pkg);
  const cents = chosen?.eur_cents ?? 0;
  const amount = (cents / 100).toFixed(2).replace('.', lang === 'fr' ? ',' : '.');
  return (
    <P3Shell locale={locale} setLocale={setLocale} back="/sponsors" backLabel={x.backSponsors}>
      <h1>{d['checkout.title']}</h1>
      <p className="alert" lang={lang}>{d['stripe.testMode']}</p>
      <div className="p3-form">
        <fieldset className="reason-list">
          <legend>{x.package}</legend>
          {packages.map((p) => (
            <label key={p.package_id}>
              <input type="radio" name="package" value={p.package_id} checked={pkg === p.package_id} onChange={() => setPkg(p.package_id)} />
              <span>
                {lang === 'fr' ? p.display_fr : p.display_en} · <bdi dir="ltr">{eur(p.eur_cents, lang)}</bdi>
              </span>
            </label>
          ))}
        </fieldset>
        {chosen ? <SplitPreview locale={locale} amountCents={cents} /> : <p className="alert">{d['amount.invalid']}</p>}
        <p className="freshness">{d['gloss.usdc']}</p>
        <label className="p3-field">
          <span>{x.recipient}</span>
          <select defaultValue="most-needed">
            <option value="most-needed">{x.mostNeeded}</option>
          </select>
          <small className="freshness">{x.recipientNote}</small>
        </label>
        <label className="p3-check">
          <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} />
          <span>{d.nameOptIn}</span>
        </label>
        <p className="freshness">{d['nameOptIn.moderation']}</p>
        <button className="btn-1" type="button" disabled={!testCheckout || !chosen}>
          {d['checkout.pay'].replace('{amount}', amount)}
        </button>
        {!testCheckout ? <p className="freshness">{x.payOff}</p> : null}
      </div>
      <p>
        <Link href={`/sponsors/receipt/?ref=${SAMPLE_REF}`}>{x.sample}</Link>
      </p>
    </P3Shell>
  );
}
