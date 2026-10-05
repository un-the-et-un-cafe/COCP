'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import report from '@/data/qa-report.json';
import { useLocale, type Locale } from '../../use-locale';

const copy: Record<Locale, { title: string; back: string; note: string }> = {
  fr: {
    title: 'QA des fiches (agrégé)',
    back: 'Préparation',
    note: 'Rapport technique sans données personnelles. Les paiements restent fermés.',
  },
  en: {
    title: 'Listings QA (aggregate)',
    back: 'Readiness',
    note: 'Technical report with no personal data. Payments remain closed.',
  },
  ar: {
    title: 'فحص السجلات (إجمالي)',
    back: 'الجاهزية',
    note: 'تقرير تقني بدون بيانات شخصية. تبقى المدفوعات مغلقة.',
  },
};

export default function ListingsQaPage() {
  const { locale } = useLocale();
  const t = copy[locale];
  const r = report as {
    total: number;
    unverified: number;
    publishable: number;
    expired: number;
    missing_phone_count: number;
    missing_hours_count: number;
    category_coverage: Record<string, boolean>;
  };

  return (
    <main className="readiness-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Link href="/readiness">
        <ArrowLeft size={16} aria-hidden /> {t.back}
      </Link>
      <h1>{t.title}</h1>
      <p>{t.note}</p>
      <ul>
        <li>total: {r.total}</li>
        <li>unverified: {r.unverified}</li>
        <li>publishable: {r.publishable}</li>
        <li>expired: {r.expired}</li>
        <li>missing phone: {r.missing_phone_count}</li>
        <li>missing hours: {r.missing_hours_count}</li>
        <li>coverage food: {String(r.category_coverage?.food)}</li>
        <li>coverage water: {String(r.category_coverage?.water)}</li>
        <li>coverage healthcare: {String(r.category_coverage?.healthcare)}</li>
        <li>coverage shelter: {String(r.category_coverage?.shelter)}</li>
      </ul>
    </main>
  );
}
