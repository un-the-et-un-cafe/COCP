'use client';

import Link from 'next/link';
import { ArrowLeft, Languages, ShieldAlert } from 'lucide-react';
import { SplitPreview } from '../../split-preview';
import { TestnetBanner } from '../../testnet-banner';
import { isRtl, useLocale, type Locale } from '../../use-locale';
import flags from '@/data/feature-flags.json';

const panel: Record<Locale, { title: string; active: string; card: string; sepa: string; idle: string; counsel: string }> = {
  en: {
    title: 'Test checkout (Stripe test mode)',
    active: 'Stripe test mode only. No real charges. Production sponsors will pay by card/SEPA after human gates; 90% settles USDC via authorised CASP — not DIY.',
    card: ' Card test UI flag on.',
    sepa: ' SEPA test UI flag on.',
    idle: 'Test checkout panel idle — payments_card_testmode_ui and payments_sepa_testmode_ui are false. No Stripe script tags are loaded.',
    counsel: 'Counsel note: card chargebacks can arrive after the configured refund window; production must not auto-payout until counsel signs the risk policy.',
  },
  fr: {
    title: 'Paiement test (Stripe test mode)',
    active: 'Mode test Stripe uniquement. Aucun débit réel. En production, les sponsors paieront par carte/SEPA après validation humaine ; 90 % sont réglés en USDC via un PSCA agréé — jamais en interne.',
    card: ' Indicateur d’interface test carte activé.',
    sepa: ' Indicateur d’interface test SEPA activé.',
    idle: 'Panneau de paiement test inactif — payments_card_testmode_ui et payments_sepa_testmode_ui sont à false. Aucun script Stripe n’est chargé.',
    counsel: 'Note juridique : des rétrofacturations par carte peuvent arriver après la fenêtre de remboursement configurée ; la production ne doit pas verser automatiquement tant que le conseil juridique n’a pas validé la politique de risque.',
  },
  ar: {
    title: 'دفع تجريبي (Stripe test mode)',
    active: 'وضع Stripe التجريبي فقط. لا خصومات حقيقية. في الإنتاج سيدفع الرعاة بالبطاقة أو SEPA بعد موافقات بشرية؛ وتُسوّى نسبة 90٪ بعملة USDC عبر مزوّد خدمات أصول مشفّرة معتمد — وليس داخليًا.',
    card: ' مؤشر واجهة اختبار البطاقة مفعّل.',
    sepa: ' مؤشر واجهة اختبار SEPA مفعّل.',
    idle: 'لوحة الدفع التجريبي متوقفة — payments_card_testmode_ui و payments_sepa_testmode_ui قيمتهما false. لا يتم تحميل أي سكربت Stripe.',
    counsel: 'ملاحظة قانونية: قد تصل استردادات البطاقات بعد نافذة الاسترداد المحددة؛ يجب ألا يدفع الإنتاج تلقائيًا قبل أن يوقّع المستشار القانوني سياسة المخاطر.',
  },
};

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
    pendingReview?: string;
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
      '2. Calcul en euros : au moins 90 % vont aux associations ; la part d’administration est plafonnée à 10 % et aux coûts documentés (EUR hors chaîne), tout reliquat va à des associations locales nommées',
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
      '2. Calculation in euros: at least 90% goes to associations; the admin share is capped at 10% and at documented costs (EUR off-chain), with any unused remainder going to named local charities',
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
      '2. الحساب باليورو: يذهب 90٪ على الأقل إلى الجمعيات، وحصة الإدارة محدودة بـ10٪ وبالتكاليف الموثّقة (باليورو خارج السلسلة)، وأي فائض غير مستخدم يذهب إلى جمعيات محلية مسمّاة',
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
    pendingReview:
      'مسودة ترجمة أولية — بانتظار مراجعة بشرية (pending_human_review). لا تُستخدم خارج التجربة قبل المراجعة.',
  },
};

const evidenceHref: Record<Locale, string> = {
  fr: '/evidence/evidence-pack.synthetic.fr.html',
  en: '/evidence/evidence-pack.synthetic.en.html',
  ar: '/evidence/evidence-pack.synthetic.ar.html',
};

// Links to the P3 sandbox screens; labels pending Whitey (ar falls back to en).
const p3 = { fr: { checkout: 'Paiement (test)', batch: 'Détail du versement (synthétique)' }, en: { checkout: 'Checkout (test)', batch: 'Settlement detail (synthetic)' } };

export default function SponsorSandboxPage() {
  const [locale, setLocale] = useLocale();
  const t = copy[locale];
  const f = (flags as { flags: { payments_base_testnet_ui: boolean; payments_card_testmode_ui: boolean; payments_sepa_testmode_ui: boolean } }).flags;
  const testnetUi = Boolean(f.payments_base_testnet_ui);
  const cardTest = Boolean(f.payments_card_testmode_ui);
  const sepaTest = Boolean(f.payments_sepa_testmode_ui);
  const testCheckout = cardTest || sepaTest;
  const dir = isRtl(locale) ? 'rtl' : 'ltr';

  return (
    <main className="sponsor-page" dir={dir} data-locale={locale} data-dir={dir}>
      {/* Defence-in-depth noindex (Netlify headers also set X-Robots-Tag). */}
      <header className="site-header">
        <Link className="brand-block brand-home" href="/" aria-label="Calais">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <div>
            <p className="brand-name">Calais Open Commons</p>
            <p className="brand-note">{t.brandNote}</p>
          </div>
        </Link>
        <div className="header-actions">
          <Link href="/sponsors" className="directory-link">
            <ArrowLeft aria-hidden size={16} /> {t.back}
          </Link>
          <label className="language-control">
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
      <TestnetBanner locale={locale} />

      <section className="sponsor-hero">
        <h1>{t.title}</h1>
        {locale === 'ar' && t.pendingReview ? (
          <output className="disabled-notice" data-pending-human-review="true">
            {t.pendingReview}
          </output>
        ) : null}
        <p>{t.modelB}</p>
        <p className="disabled-notice">
          <ShieldAlert aria-hidden size={18} /> {t.warning}
        </p>
        {!testnetUi ? <p>{t.disabled}</p> : null}
      </section>

      <section className="sponsor-section sandbox-card">
        <SplitPreview locale={locale} amountCents={7900} />
        <ol className="sandbox-steps">
          {t.flow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p>{t.mainnet}</p>
        <p>{t.casp}</p>
        <p className="sandbox-links">
          <a href={evidenceHref[locale]}>{t.evidence}</a>
          {' · '}
          <Link href="/sponsors/ledger">{t.ledger}</Link>
          {' · '}
          <Link href="/sponsors/checkout">{p3[locale === 'fr' ? 'fr' : 'en'].checkout}</Link>
          {' · '}
          <Link href="/sponsors/ledger/batch/?id=sandbox-verification-2026-10">{p3[locale === 'fr' ? 'fr' : 'en'].batch}</Link>
        </p>
      </section>

      <section className="sponsor-section sandbox-card" data-testid="test-checkout-panel">
        <h2>{panel[locale].title}</h2>
        {testCheckout ? (
          <p>
            {panel[locale].active}
            {cardTest ? panel[locale].card : ''}
            {sepaTest ? panel[locale].sepa : ''}
          </p>
        ) : (
          <p>{panel[locale].idle}</p>
        )}
        <p className="disabled-notice">{panel[locale].counsel}</p>
      </section>
      {/* Intentionally documentary only unless testmode flags: no wallet SDK; no Stripe when flags false. */}
    </main>
  );
}
