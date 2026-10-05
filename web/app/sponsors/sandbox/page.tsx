'use client';

import Link from 'next/link';
import { ArrowLeft, Languages, ShieldAlert } from 'lucide-react';
import { useLocale, type Locale } from '../../use-locale';
import flags from '@/data/feature-flags.json';

const copy: Record<
  Locale,
  {
    brandNote: string;
    back: string;
    language: string;
    title: string;
    modelB: string;
    flow: string[];
    warning: string;
    mainnet: string;
    casp: string;
    evidence: string;
    ledger: string;
    disabled: string;
  }
> = {
  fr: {
    brandNote: 'Bac à sable — règlement Model B',
    back: 'Sponsors',
    language: 'Langue',
    title: 'Répétition de règlement (testnet)',
    modelB:
      'En production, les sponsors paient par carte ou SEPA en euros. Ce bac à sable montre uniquement la jambe de règlement crypto : 90 % en USDC sur Base testnet vers une association de test, après un sponsoring TradFi simulé.',
    flow: [
      '1. Sponsoring TradFi simulé (réf. fiat synthétique, fenêtre de remboursement fermée)',
      '2. Calcul 90/10 en euros (10 % admin peut rester en EUR hors chaîne)',
      '3. Paiement testnet USDC de la jambe 90 % (aucun connect wallet sponsor)',
      '4. Ligne de registre : réf. fiat + montant USDC + hash de transaction',
    ],
    warning:
      'Paiements désactivés. Aucune clé live. Aucun mainnet. Interface non indexée.',
    mainnet: 'Le mainnet exige G9 et une confirmation explicite de Jakob.',
    casp:
      'La conversion EUR→USDC en production doit passer par un CASP autorisé — jamais une garde/échange maison dans cette application.',
    evidence: 'Exemple de pack de preuves (synthétique)',
    ledger: 'Registre public',
    disabled: 'Le drapeau payments_base_testnet_ui est false : démonstration documentaire uniquement.',
  },
  en: {
    brandNote: 'Sandbox — Model B settlement',
    back: 'Sponsors',
    language: 'Language',
    title: 'Settlement rehearsal (testnet)',
    modelB:
      'In production, sponsors pay by card or SEPA in euros. This sandbox only shows the crypto settlement leg: 90% testnet USDC on Base to a test association after a simulated TradFi sponsorship.',
    flow: [
      '1. Simulated TradFi sponsorship (synthetic fiat ref, refund window closed)',
      '2. 90/10 split in euros (10% admin may stay EUR off-chain)',
      '3. Testnet USDC payout of the 90% leg (no sponsor wallet connect)',
      '4. Ledger row: fiat ref + USDC amount + transaction hash',
    ],
    warning: 'Payments disabled. No live keys. No mainnet. Non-indexed UI.',
    mainnet: 'Mainnet requires G9 + Jakob explicit confirm.',
    casp:
      'Production EUR→USDC conversion must use an authorised CASP partner — never DIY custody/exchange in this app.',
    evidence: 'Example evidence pack (synthetic)',
    ledger: 'Public ledger',
    disabled: 'payments_base_testnet_ui is false: documentary demo only.',
  },
  ar: {
    brandNote: 'بيئة تجريبية — تسوية النموذج B',
    back: 'الرعاة',
    language: 'اللغة',
    title: 'تدريب التسوية (شبكة اختبار)',
    modelB:
      'في الإنتاج يدفع الرعاة بالبطاقة أو SEPA باليورو. تعرض هذه البيئة فقط مرحلة التسوية بالعملات المشفرة: 90٪ USDC على Base اختبار إلى جمعية اختبار بعد رعاية تقليدية محاكية.',
    flow: [
      '1. رعاية تقليدية محاكية (مرجع دفع اصطناعي، نافذة الاسترداد مغلقة)',
      '2. تقسيم 90/10 باليورو (10٪ إدارة قد تبقى باليورو خارج السلسلة)',
      '3. دفع USDC على شبكة الاختبار لمرحلة الـ90٪ (بدون ربط محفظة للراعي)',
      '4. صف السجل: مرجع تقليدي + مبلغ USDC + هاش المعاملة',
    ],
    warning: 'المدفوعات معطّلة. لا مفاتيح حية. لا شبكة رئيسية. واجهة غير مفهرسة.',
    mainnet: 'الشبكة الرئيسية تتطلب G9 وتأكيداً صريحاً من Jakob.',
    casp:
      'تحويل EUR→USDC في الإنتاج يجب أن يمر عبر شريك CASP مرخّص — وليس حضانة/تبديل ذاتي في هذا التطبيق.',
    evidence: 'مثال حزمة الأدلة (اصطناعي)',
    ledger: 'السجل العام',
    disabled: 'علم payments_base_testnet_ui = false: عرض توثيقي فقط.',
  },
};

export default function SponsorSandboxPage() {
  const [locale, setLocale] = useLocale();
  const t = copy[locale];
  const testnetUi = Boolean((flags as { flags: { payments_base_testnet_ui: boolean } }).flags.payments_base_testnet_ui);

  return (
    <main className="sponsor-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="page-header">
        <p className="brand-note">{t.brandNote}</p>
        <div className="header-actions">
          <Link href="/sponsors" className="text-link">
            <ArrowLeft aria-hidden size={16} /> {t.back}
          </Link>
          <label className="language-switch">
            <Languages aria-hidden size={16} />
            <span className="sr-only">{t.language}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
          </label>
        </div>
      </header>

      <section className="hero">
        <h1>{t.title}</h1>
        <p>{t.modelB}</p>
        <p className="warn-banner">
          <ShieldAlert aria-hidden size={18} /> {t.warning}
        </p>
        {!testnetUi ? <p>{t.disabled}</p> : null}
      </section>

      <section>
        <ol>
          {t.flow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p>{t.mainnet}</p>
        <p>{t.casp}</p>
        <p>
          <a href="/evidence/evidence-pack.synthetic.fr.html">{t.evidence}</a>
          {' · '}
          <Link href="/sponsors/ledger">{t.ledger}</Link>
        </p>
      </section>
      {/* Intentionally documentary only: no wallet SDK, no payment form. */}
    </main>
  );
}
