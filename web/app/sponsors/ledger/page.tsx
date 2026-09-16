'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Banknote,
  ExternalLink,
  FileCheck2,
  Languages,
  ShieldCheck,
} from 'lucide-react';
import ledgerData from '@/data/sponsor-ledger.json';
import { useLocale, type Locale } from '../../use-locale';

type Transfer = {
  recipient_label: string;
  recipient_type: 'local_charity' | 'founder_housing_support';
  amount_cents: number;
  transferred_at: string;
  evidence_url: string;
};
type Deliverable = { label: string; count: number; evidence_url: string };
type Period = {
  id: string;
  period_start: string;
  period_end: string;
  gross_revenue_cents: number;
  refunds_cents: number;
  taxes_cents: number;
  payment_fees_cents: number;
  operating_costs_cents: number;
  net_profit_cents: number;
  transfers: Transfer[];
  deliverables: Deliverable[];
};
type Recognition = {
  display_name: string;
  consent: true;
  consented_at: string;
  expires_at: string;
};
type Ledger = {
  version: number;
  currency: 'EUR';
  updated_at: string | null;
  periods: Period[];
  recognition: Recognition[];
};

const copy = {
  fr: {
    brandNote: 'Comptes publics agrégés',
    back: 'Partenariats',
    language: 'Langue',
    eyebrow: 'Transparence financière',
    title: 'Registre public du sponsoring',
    intro:
      'Ce registre publie uniquement des montants agrégés, les résultats financés et les preuves de transfert. Il ne contient aucune donnée sur les personnes qui utilisent les services.',
    disabled:
      'Les paiements restent désactivés. Aucun revenu de sponsoring n’est actuellement enregistré.',
    gross: 'Revenus bruts',
    costs: 'Remboursements, taxes, frais et coûts',
    profit: 'Bénéfice net',
    transferred: 'Bénéfice net reversé',
    emptyTitle: 'Aucune période financière publiée',
    emptyNote:
      'La première période apparaîtra uniquement après l’approbation des paiements, la réconciliation et la vérification des preuves.',
    periods: 'Périodes publiées',
    revenue: 'Revenus',
    refunds: 'Remboursements',
    taxes: 'Taxes',
    fees: 'Frais de paiement',
    operating: 'Coûts de fonctionnement',
    transfers: 'Transferts',
    deliverables: 'Résultats financés',
    evidence: 'Preuve publique',
    recognition: 'Reconnaissance consentie',
    recognitionNote:
      'Seuls les noms ayant un consentement explicite et une date d’expiration valide peuvent apparaître.',
    updated: 'Mis à jour',
  },
  en: {
    brandNote: 'Aggregate public accounts',
    back: 'Partnerships',
    language: 'Language',
    eyebrow: 'Financial transparency',
    title: 'Public sponsorship ledger',
    intro:
      'This ledger publishes only aggregate amounts, funded results and transfer evidence. It contains no data about people who use services.',
    disabled:
      'Payments remain disabled. No sponsorship revenue is currently recorded.',
    gross: 'Gross revenue',
    costs: 'Refunds, taxes, fees and costs',
    profit: 'Net profit',
    transferred: 'Net profit transferred',
    emptyTitle: 'No financial period published',
    emptyNote:
      'The first period will appear only after payment approval, reconciliation and evidence review.',
    periods: 'Published periods',
    revenue: 'Revenue',
    refunds: 'Refunds',
    taxes: 'Taxes',
    fees: 'Payment fees',
    operating: 'Operating costs',
    transfers: 'Transfers',
    deliverables: 'Funded results',
    evidence: 'Public evidence',
    recognition: 'Consented recognition',
    recognitionNote:
      'Only names with explicit consent and a valid expiry date may appear.',
    updated: 'Updated',
  },
  ar: {
    brandNote: 'حسابات عامة إجمالية',
    back: 'الشراكات',
    language: 'اللغة',
    eyebrow: 'الشفافية المالية',
    title: 'السجل العام للرعاية',
    intro:
      'ينشر هذا السجل المبالغ الإجمالية والنتائج الممولة وأدلة التحويل فقط، ولا يتضمن بيانات عن مستخدمي الخدمات.',
    disabled: 'لا يزال الدفع معطلاً، ولا توجد إيرادات رعاية مسجلة حالياً.',
    gross: 'الإيراد الإجمالي',
    costs: 'الاستردادات والضرائب والرسوم والتكاليف',
    profit: 'صافي الربح',
    transferred: 'صافي الربح المحوّل',
    emptyTitle: 'لم تُنشر أي فترة مالية',
    emptyNote:
      'لن تظهر الفترة الأولى إلا بعد اعتماد الدفع والمطابقة ومراجعة الأدلة.',
    periods: 'الفترات المنشورة',
    revenue: 'الإيرادات',
    refunds: 'الاستردادات',
    taxes: 'الضرائب',
    fees: 'رسوم الدفع',
    operating: 'تكاليف التشغيل',
    transfers: 'التحويلات',
    deliverables: 'النتائج الممولة',
    evidence: 'دليل عام',
    recognition: 'تقدير بموافقة',
    recognitionNote:
      'لا تظهر إلا الأسماء ذات الموافقة الصريحة وتاريخ انتهاء صالح.',
    updated: 'آخر تحديث',
  },
} as const;

const ledger = ledgerData as Ledger;

export default function SponsorLedgerPage() {
  const [locale, setLocale] = useLocale();
  const text = copy[locale];
  const formatMoney = (cents: number) =>
    new Intl.NumberFormat(
      locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-GB' : 'ar',
      { style: 'currency', currency: ledger.currency },
    ).format(cents / 100);
  const totals = ledger.periods.reduce(
    (sum, period) => ({
      gross: sum.gross + period.gross_revenue_cents,
      costs:
        sum.costs +
        period.refunds_cents +
        period.taxes_cents +
        period.payment_fees_cents +
        period.operating_costs_cents,
      profit: sum.profit + period.net_profit_cents,
      transferred:
        sum.transferred +
        period.transfers.reduce(
          (amount, transfer) => amount + transfer.amount_cents,
          0,
        ),
    }),
    { gross: 0, costs: 0, profit: 0, transferred: 0 },
  );

  return (
    <main className="ledger-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="site-header">
        <Link className="brand-block brand-home" href="/">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <div>
            <p className="brand-name">Calais Open Commons</p>
            <p className="brand-note">{text.brandNote}</p>
          </div>
        </Link>
        <div className="header-actions">
          <Link className="directory-link" href="/sponsors">
            <ArrowLeft size={18} aria-hidden="true" />
            {text.back}
          </Link>
          <label className="language-control">
            <Languages size={19} aria-hidden="true" />
            <span className="sr-only">{text.language}</span>
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </label>
        </div>
      </header>

      <section className="ledger-shell">
        <div className="ledger-intro">
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
          <div className="disabled-notice">
            <ShieldCheck size={20} aria-hidden="true" />
            <span>{text.disabled}</span>
          </div>
        </div>
        <dl className="ledger-summary">
          <div>
            <dt>{text.gross}</dt>
            <dd>{formatMoney(totals.gross)}</dd>
          </div>
          <div>
            <dt>{text.costs}</dt>
            <dd>{formatMoney(totals.costs)}</dd>
          </div>
          <div>
            <dt>{text.profit}</dt>
            <dd>{formatMoney(totals.profit)}</dd>
          </div>
          <div>
            <dt>{text.transferred}</dt>
            <dd>{formatMoney(totals.transferred)}</dd>
          </div>
        </dl>

        <section className="ledger-periods" aria-labelledby="periods-title">
          <div className="section-heading">
            <p className="eyebrow">{text.eyebrow}</p>
            <h2 id="periods-title">{text.periods}</h2>
          </div>
          {ledger.periods.length === 0 ? (
            <div className="release-empty">
              <Banknote size={28} aria-hidden="true" />
              <div>
                <h3>{text.emptyTitle}</h3>
                <p>{text.emptyNote}</p>
              </div>
            </div>
          ) : (
            ledger.periods.map((period) => (
              <article className="ledger-period" key={period.id}>
                <header>
                  <div>
                    <h3>
                      {period.period_start} — {period.period_end}
                    </h3>
                    <p>
                      {text.profit}: {formatMoney(period.net_profit_cents)}
                    </p>
                  </div>
                </header>
                <dl className="ledger-breakdown">
                  <div>
                    <dt>{text.revenue}</dt>
                    <dd>{formatMoney(period.gross_revenue_cents)}</dd>
                  </div>
                  <div>
                    <dt>{text.refunds}</dt>
                    <dd>{formatMoney(period.refunds_cents)}</dd>
                  </div>
                  <div>
                    <dt>{text.taxes}</dt>
                    <dd>{formatMoney(period.taxes_cents)}</dd>
                  </div>
                  <div>
                    <dt>{text.fees}</dt>
                    <dd>{formatMoney(period.payment_fees_cents)}</dd>
                  </div>
                  <div>
                    <dt>{text.operating}</dt>
                    <dd>{formatMoney(period.operating_costs_cents)}</dd>
                  </div>
                </dl>
                <div className="ledger-evidence">
                  <div>
                    <h4>{text.transfers}</h4>
                    {period.transfers.map((transfer) => (
                      <p
                        key={`${transfer.recipient_label}-${transfer.transferred_at}`}
                      >
                        {transfer.recipient_label}:{' '}
                        {formatMoney(transfer.amount_cents)}{' '}
                        <a
                          href={transfer.evidence_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={15} aria-hidden="true" />
                          {text.evidence}
                        </a>
                      </p>
                    ))}
                  </div>
                  <div>
                    <h4>{text.deliverables}</h4>
                    {period.deliverables.map((item) => (
                      <p key={`${item.label}-${item.evidence_url}`}>
                        {item.count} × {item.label}{' '}
                        <a
                          href={item.evidence_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FileCheck2 size={15} aria-hidden="true" />
                          {text.evidence}
                        </a>
                      </p>
                    ))}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        {ledger.recognition.length > 0 ? (
          <section
            className="ledger-recognition"
            aria-labelledby="recognition-title"
          >
            <h2 id="recognition-title">{text.recognition}</h2>
            <p>{text.recognitionNote}</p>
            <ul>
              {ledger.recognition.map((item) => (
                <li key={`${item.display_name}-${item.consented_at}`}>
                  {item.display_name} · {text.updated}{' '}
                  {item.consented_at.slice(0, 10)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {ledger.updated_at ? (
          <p className="ledger-updated">
            {text.updated}:{' '}
            <time dateTime={ledger.updated_at}>
              {ledger.updated_at.slice(0, 10)}
            </time>
          </p>
        ) : null}
      </section>
    </main>
  );
}
