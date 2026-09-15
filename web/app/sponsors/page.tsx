'use client';

import {
  ArrowLeft,
  BadgeCheck,
  FileCheck2,
  HeartHandshake,
  Languages,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useLocale, type Locale } from '../use-locale';

const copy = {
  fr: {
    brandNote: 'Partenariats responsables',
    back: 'Répertoire',
    language: 'Langue',
    eyebrow: 'Financer un résultat public',
    title: 'Soutenez des informations locales fiables et gratuites',
    intro:
      'Un sponsor finance la vérification, la traduction ou la diffusion. Il n’achète jamais de données, de classement ni d’accès aux bénéficiaires.',
    disabledTitle: 'Les paiements ne sont pas encore activés.',
    disabledNote:
      'L’entité responsable, la facturation, les comptes et les procédures de remboursement doivent d’abord être approuvés.',
    offersEyebrow: 'Offres fixes',
    offersTitle: 'Choisissez le résultat à financer',
    pending: 'Ouverture après validation',
    offers: [
      {
        price: '79 €',
        name: 'Sponsor fondateur',
        result:
          'Finance une session de vérification. Comprend une preuve publique, une reconnaissance limitée dans le temps et une note d’impact agrégée.',
      },
      {
        price: '149 €',
        name: 'Langue supplémentaire',
        result:
          'Finance une traduction relue et un lot de cartes QR, après validation du traducteur et du partenaire de distribution.',
      },
      {
        price: '249 €',
        name: 'Pack de vérification',
        result:
          'Nettoyage et préparation de 30 fiches publiques au maximum, avec sources et journal des modifications.',
      },
    ],
    allocationEyebrow: 'Règle financière',
    allocationTitle: 'Chaque euro doit être traçable',
    allocationIntro:
      'La politique cible affecte 90 % de chaque sponsoring au bénéficiaire associatif sélectionné et 10 % à l’administration du projet avant frais et taxes.',
    allocationRule:
      'Après remboursements, taxes, frais de paiement et coûts de fonctionnement documentés, 100 % du bénéfice net est reversé chaque mois à des associations locales nommées.',
    allocations: [
      'Affectation associative cible',
      'Administration avant coûts',
      'Bénéfice net reversé',
    ],
    evidenceEyebrow: 'Preuves et limites',
    evidenceTitle: 'Ce que reçoit un sponsor',
    evidence: [
      {
        title: 'Preuve claire',
        note: 'Reçu ou facture, affectation, statut du paiement et résultat financé.',
      },
      {
        title: 'Reconnaissance consentie',
        note: 'Nom ou logo uniquement avec accord, date d’expiration et retrait simple.',
      },
      {
        title: 'Impact utile',
        note: 'Fiches vérifiées, langues relues et supports distribués, mesurés sans profilage.',
      },
      {
        title: 'Aucune contrepartie cachée',
        note: 'Aucun accès aux personnes, aucune publicité dans les services essentiels et aucune influence éditoriale.',
      },
    ],
  },
  en: {
    brandNote: 'Responsible partnerships',
    back: 'Directory',
    language: 'Language',
    eyebrow: 'Fund a public result',
    title: 'Support reliable, free local information',
    intro:
      'A sponsor funds verification, translation or distribution. Sponsorship never buys data, ranking or access to people using services.',
    disabledTitle: 'Payments are not enabled yet.',
    disabledNote:
      'The responsible entity, invoicing, accounts and refund procedures must be approved first.',
    offersEyebrow: 'Fixed offers',
    offersTitle: 'Choose the result to fund',
    pending: 'Opens after approval',
    offers: [
      {
        price: '€79',
        name: 'Founding sponsor',
        result:
          'Funds one verification session, including public evidence, time-limited recognition and an aggregate impact note.',
      },
      {
        price: '€149',
        name: 'Additional language',
        result:
          'Funds a reviewed translation and a batch of QR cards after approval by the translator and distribution partner.',
      },
      {
        price: '€249',
        name: 'Verification pack',
        result:
          'Cleans and prepares up to 30 public entries with sources and a change log.',
      },
    ],
    allocationEyebrow: 'Financial rule',
    allocationTitle: 'Every euro must be traceable',
    allocationIntro:
      'The target policy allocates 90% of each sponsorship to the selected charity beneficiary and 10% to project administration before fees and taxes.',
    allocationRule:
      'After refunds, taxes, payment fees and documented operating costs, 100% of net profit is transferred monthly to named local charities.',
    allocations: [
      'Target charity allocation',
      'Administration before costs',
      'Net profit transferred',
    ],
    evidenceEyebrow: 'Evidence and limits',
    evidenceTitle: 'What a sponsor receives',
    evidence: [
      {
        title: 'Clear evidence',
        note: 'Receipt or invoice, allocation, payment status and the funded result.',
      },
      {
        title: 'Recognition by consent',
        note: 'Name or logo only with consent, an expiry date and simple removal.',
      },
      {
        title: 'Useful impact',
        note: 'Verified entries, reviewed languages and distributed materials, measured without profiling.',
      },
      {
        title: 'No hidden benefit',
        note: 'No access to people, no advertising in essential services and no editorial influence.',
      },
    ],
  },
  ar: {
    brandNote: 'شراكات مسؤولة',
    back: 'الدليل',
    language: 'اللغة',
    eyebrow: 'تمويل نتيجة عامة',
    title: 'ادعم معلومات محلية موثوقة ومجانية',
    intro:
      'يموّل الراعي التحقق أو الترجمة أو التوزيع، ولا يشتري بيانات أو ترتيباً أو وصولاً إلى مستخدمي الخدمات.',
    disabledTitle: 'الدفع غير مفعّل بعد.',
    disabledNote:
      'يجب أولاً اعتماد الجهة المسؤولة والفواتير والحسابات وإجراءات الاسترداد.',
    offersEyebrow: 'عروض ثابتة',
    offersTitle: 'اختر النتيجة التي تريد تمويلها',
    pending: 'يتاح بعد الاعتماد',
    offers: [
      {
        price: '79 €',
        name: 'راعٍ مؤسس',
        result:
          'يموّل جلسة تحقق تشمل دليلاً عاماً وتقديراً محدود المدة وملاحظة أثر إجمالية.',
      },
      {
        price: '149 €',
        name: 'لغة إضافية',
        result:
          'يموّل ترجمة مراجعة ومجموعة بطاقات QR بعد اعتماد المترجم وشريك التوزيع.',
      },
      {
        price: '249 €',
        name: 'حزمة تحقق',
        result:
          'تنظيف وإعداد ما يصل إلى 30 سجلاً عاماً مع المصادر وسجل التغييرات.',
      },
    ],
    allocationEyebrow: 'القاعدة المالية',
    allocationTitle: 'يجب تتبع كل يورو',
    allocationIntro:
      'تخصص السياسة المستهدفة 90٪ من كل رعاية للجهة الخيرية المستفيدة و10٪ لإدارة المشروع قبل الرسوم والضرائب.',
    allocationRule:
      'بعد الاستردادات والضرائب ورسوم الدفع وتكاليف التشغيل الموثقة، يُحوّل 100٪ من صافي الربح شهرياً إلى جمعيات محلية محددة بالاسم.',
    allocations: [
      'التخصيص الخيري المستهدف',
      'الإدارة قبل التكاليف',
      'صافي الربح المحوّل',
    ],
    evidenceEyebrow: 'الأدلة والحدود',
    evidenceTitle: 'ما يحصل عليه الراعي',
    evidence: [
      {
        title: 'دليل واضح',
        note: 'إيصال أو فاتورة وتخصيص وحالة الدفع والنتيجة الممولة.',
      },
      {
        title: 'تقدير بموافقة',
        note: 'الاسم أو الشعار بموافقة فقط، مع تاريخ انتهاء وإزالة سهلة.',
      },
      {
        title: 'أثر مفيد',
        note: 'سجلات متحقق منها ولغات مراجعة ومواد موزعة، بقياس لا يعتمد على التنميط.',
      },
      {
        title: 'لا منفعة خفية',
        note: 'لا وصول إلى الأشخاص ولا إعلانات في الخدمات الأساسية ولا تأثير تحريري.',
      },
    ],
  },
} as const;

const evidenceIcons = [FileCheck2, BadgeCheck, Languages, HeartHandshake];

export default function SponsorsPage() {
  const [locale, setLocale] = useLocale();
  const text = copy[locale];

  return (
    <main className="sponsor-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
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
          <Link className="directory-link" href="/">
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

      <section className="sponsor-hero">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
        <output className="disabled-notice">
          <ShieldCheck size={20} aria-hidden="true" />
          <span>
            <strong>{text.disabledTitle}</strong> {text.disabledNote}
          </span>
        </output>
      </section>

      <section className="sponsor-section" aria-labelledby="offers-title">
        <div className="section-heading">
          <p className="eyebrow">{text.offersEyebrow}</p>
          <h2 id="offers-title">{text.offersTitle}</h2>
        </div>
        <div className="offer-grid">
          {text.offers.map((offer) => (
            <article className="offer-card" key={offer.name}>
              <p className="offer-price">{offer.price}</p>
              <h3>{offer.name}</h3>
              <p>{offer.result}</p>
              <span className="pending-label">{text.pending}</span>
            </article>
          ))}
        </div>
      </section>

      <section
        className="sponsor-section allocation-section"
        aria-labelledby="allocation-title"
      >
        <div>
          <p className="eyebrow">{text.allocationEyebrow}</p>
          <h2 id="allocation-title">{text.allocationTitle}</h2>
          <p>{text.allocationIntro}</p>
          <p>
            <strong>{text.allocationRule}</strong>
          </p>
        </div>
        <dl className="allocation-list">
          <div>
            <dt>90 %</dt>
            <dd>{text.allocations[0]}</dd>
          </div>
          <div>
            <dt>10 %</dt>
            <dd>{text.allocations[1]}</dd>
          </div>
          <div>
            <dt>100 %</dt>
            <dd>{text.allocations[2]}</dd>
          </div>
        </dl>
      </section>

      <section className="sponsor-section" aria-labelledby="evidence-title">
        <div className="section-heading">
          <p className="eyebrow">{text.evidenceEyebrow}</p>
          <h2 id="evidence-title">{text.evidenceTitle}</h2>
        </div>
        <div className="evidence-grid">
          {text.evidence.map((item, index) => {
            const Icon = evidenceIcons[index];
            return (
              <article key={item.title}>
                <Icon aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.note}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
