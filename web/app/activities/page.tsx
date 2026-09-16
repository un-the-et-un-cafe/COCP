'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Ban,
  CircleDotDashed,
  Languages,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import registerData from '@/data/activity-ideas.json';
import { useLocale, type Locale } from '../use-locale';

type ActivityIdea = {
  id: string;
  title: Record<Locale, string>;
  value: Record<Locale, string>;
  classification:
    | 'peer_service'
    | 'authorized_retail'
    | 'city_benefit_work'
    | 'civic_reporting'
    | 'community_participation';
  compensation: 'none' | 'expenses_only' | 'eur_only';
  public_status:
    | 'submitted'
    | 'triage'
    | 'needs_partner'
    | 'legally_cleared'
    | 'pilot'
    | 'active'
    | 'paused'
    | 'rejected';
  risks: string[];
  required_gates: string[];
  activation_allowed: boolean;
};

const register = registerData as unknown as {
  updated_at: string;
  ideas: ActivityIdea[];
};

const copy = {
  fr: {
    brandNote: 'Idées sous contrôle',
    back: 'Retour au répertoire',
    language: 'Langue',
    eyebrow: 'Laboratoire d’idées',
    title: 'Des concepts publics, pas un marché du travail',
    intro:
      'Ce registre montre des activités qui pourraient être utiles et les contrôles encore manquants. Il ne permet pas de proposer ses services, de postuler, d’être mis en relation ou de recevoir un paiement.',
    disabledTitle: 'Toutes les activations sont bloquées.',
    disabled:
      'La collecte de propositions, les activités, paiements, badges et bons restent désactivés jusqu’à l’approbation d’un opérateur responsable et des contrôles juridiques et de sauvegarde.',
    processTitle: 'Chemin de décision obligatoire',
    process: [
      'Proposé',
      'Triage',
      'Partenaire requis',
      'Validation légale',
      'Pilote',
      'Actif',
    ],
    ideasTitle: 'Concepts en attente',
    status: 'Partenaire requis',
    classification: 'Classification',
    compensation: 'Valeur autorisée en principe',
    gates: 'Contrôles manquants',
    gatePending: 'En attente',
    noActivation: 'Non activable',
    classifications: {
      peer_service: 'Service entre pairs',
      authorized_retail: 'Commerce autorisé',
      city_benefit_work: 'Travail d’intérêt municipal',
      civic_reporting: 'Signalement civique',
      community_participation: 'Participation communautaire',
    },
    compensations: {
      none: 'Aucun paiement',
      expenses_only: 'Dépenses préapprouvées uniquement',
      eur_only: 'EUR uniquement après autorisation individuelle',
    },
    rulesTitle: 'Règles qui ne changent pas',
    rules: [
      'Aucun droit au travail n’est déduit d’un statut ou d’une situation personnelle.',
      'Tout travail payé exige une vérification individuelle, un contrat ou une facture, une assurance et un paiement légal en EUR.',
      'Le volontariat ne peut remplacer un poste payé ni conditionner une aide, un bon ou un avantage.',
      'Aucun nom, document, dossier, lieu de vie précis ou liste de vulnérabilité n’est publié.',
      'Aucun jeton transférable, marché secondaire, récompense spéculative ou paiement déguisé.',
    ],
    nextTitle: 'Ce qui reste à construire',
    next: 'Un opérateur de triage nommé, un canal de plainte et de retrait rapide, les preuves de chaque contrôle et une collecte anonyme limitée doivent être examinés avant toute proposition publique. Cette page n’est pas ce canal.',
    updated: 'Registre mis à jour',
  },
  en: {
    brandNote: 'Ideas under control',
    back: 'Back to directory',
    language: 'Language',
    eyebrow: 'Activity Idea Lab',
    title: 'Public concepts, not a labour marketplace',
    intro:
      'This register shows activities that might be useful and the controls still missing. It does not let anyone offer services, apply, get matched or receive payment.',
    disabledTitle: 'All activation is blocked.',
    disabled:
      'Proposal intake, activities, payments, badges and vouchers remain disabled until an accountable operator and the legal and safeguarding controls are approved.',
    processTitle: 'Mandatory decision path',
    process: [
      'Submitted',
      'Triage',
      'Needs partner',
      'Legally cleared',
      'Pilot',
      'Active',
    ],
    ideasTitle: 'Concepts waiting for review',
    status: 'Needs partner',
    classification: 'Classification',
    compensation: 'Value allowed in principle',
    gates: 'Missing controls',
    gatePending: 'Pending',
    noActivation: 'Cannot be activated',
    classifications: {
      peer_service: 'Peer service',
      authorized_retail: 'Authorized retail',
      city_benefit_work: 'City-benefit paid work',
      civic_reporting: 'Civic reporting',
      community_participation: 'Community participation',
    },
    compensations: {
      none: 'No payment',
      expenses_only: 'Pre-approved expenses only',
      eur_only: 'EUR only after individual authorization',
    },
    rulesTitle: 'Rules that do not change',
    rules: [
      'The service never infers a right to work from a status or personal situation.',
      'Any paid work requires an individual eligibility check, contract or invoice, insurance and lawful EUR payment.',
      'Volunteering cannot replace a paid role or condition help, a voucher or another benefit.',
      'No name, document, case record, precise living location or vulnerability list is published.',
      'No transferable token, secondary market, speculative reward or disguised payment.',
    ],
    nextTitle: 'What still needs to be built',
    next: 'A named triage operator, complaint and rapid-takedown route, evidence for every gate and bounded anonymous intake must be reviewed before proposals can open. This page is not that intake channel.',
    updated: 'Register updated',
  },
  ar: {
    brandNote: 'أفكار تحت الرقابة',
    back: 'العودة إلى الدليل',
    language: 'اللغة',
    eyebrow: 'مختبر أفكار الأنشطة',
    title: 'مفاهيم عامة وليست سوقاً للعمل',
    intro:
      'يعرض هذا السجل أنشطة قد تكون مفيدة والضوابط التي لا تزال ناقصة. ولا يسمح بعرض الخدمات أو التقدم أو المطابقة أو تلقي مدفوعات.',
    disabledTitle: 'جميع عمليات التفعيل محظورة.',
    disabled:
      'يبقى استقبال المقترحات والأنشطة والمدفوعات والشارات والقسائم معطلاً إلى أن يعتمد مشغل مسؤول والضوابط القانونية وضوابط الحماية.',
    processTitle: 'مسار القرار الإلزامي',
    process: ['مقترح', 'فرز', 'يحتاج شريكاً', 'مجاز قانونياً', 'تجريبي', 'نشط'],
    ideasTitle: 'مفاهيم تنتظر المراجعة',
    status: 'يحتاج شريكاً',
    classification: 'التصنيف',
    compensation: 'القيمة المسموح بها من حيث المبدأ',
    gates: 'الضوابط الناقصة',
    gatePending: 'قيد الانتظار',
    noActivation: 'غير قابل للتفعيل',
    classifications: {
      peer_service: 'خدمة بين الأفراد',
      authorized_retail: 'تجارة معتمدة',
      city_benefit_work: 'عمل مدفوع لمنفعة البلدية',
      civic_reporting: 'إبلاغ مدني',
      community_participation: 'مشاركة مجتمعية',
    },
    compensations: {
      none: 'دون دفع',
      expenses_only: 'نفقات معتمدة مسبقاً فقط',
      eur_only: 'باليورو فقط بعد التفويض الفردي',
    },
    rulesTitle: 'قواعد لا تتغير',
    rules: [
      'لا تستنتج الخدمة حق العمل من وضع أو حالة شخصية.',
      'يتطلب أي عمل مدفوع تحققاً فردياً وعقداً أو فاتورة وتأميناً ودفعاً قانونياً باليورو.',
      'لا يجوز أن يحل التطوع محل وظيفة مدفوعة أو أن يكون شرطاً للمساعدة أو القسيمة أو أي منفعة.',
      'لا يُنشر اسم أو وثيقة أو ملف حالة أو موقع سكن دقيق أو قائمة ضعف.',
      'لا رمز قابل للتحويل ولا سوق ثانوية ولا مكافأة مضاربية ولا دفع مقنّع.',
    ],
    nextTitle: 'ما الذي لا يزال مطلوباً',
    next: 'يجب اعتماد مشغل فرز محدد ومسار للشكاوى والحذف السريع وأدلة لكل ضابط واستقبال مجهول ومحدود قبل فتح المقترحات. هذه الصفحة ليست قناة استقبال.',
    updated: 'تحديث السجل',
  },
} as const;

const gateLabels: Record<Locale, Record<string, string>> = {
  fr: {
    provider_confirmation: 'Confirmation du prestataire',
    operator_review: 'Revue de l’opérateur',
    privacy_review: 'Revue de confidentialité',
    non_replacement: 'Absence de remplacement d’un emploi',
    workshop_partner: 'Atelier partenaire',
    individual_work_rights: 'Droit individuel au travail',
    contract_or_invoice: 'Contrat ou facture',
    transparent_eur_price: 'Prix transparent en EUR',
    insurance: 'Assurance',
    ppe: 'Équipement de protection',
    city_reporting_route: 'Canal de signalement municipal',
    partner_organizer: 'Organisateur partenaire',
    safeguarding: 'Sauvegarde',
    informed_consent: 'Consentement éclairé',
    no_work_conditioned_reward: 'Aucune récompense conditionnée au travail',
  },
  en: {
    provider_confirmation: 'Provider confirmation',
    operator_review: 'Operator review',
    privacy_review: 'Privacy review',
    non_replacement: 'No replacement of paid work',
    workshop_partner: 'Workshop partner',
    individual_work_rights: 'Individual right-to-work check',
    contract_or_invoice: 'Contract or invoice',
    transparent_eur_price: 'Transparent EUR price',
    insurance: 'Insurance',
    ppe: 'Protective equipment',
    city_reporting_route: 'City reporting route',
    partner_organizer: 'Partner organizer',
    safeguarding: 'Safeguarding',
    informed_consent: 'Informed consent',
    no_work_conditioned_reward: 'No work-conditioned reward',
  },
  ar: {
    provider_confirmation: 'تأكيد مقدم الخدمة',
    operator_review: 'مراجعة المشغل',
    privacy_review: 'مراجعة الخصوصية',
    non_replacement: 'عدم استبدال عمل مدفوع',
    workshop_partner: 'ورشة شريكة',
    individual_work_rights: 'التحقق الفردي من حق العمل',
    contract_or_invoice: 'عقد أو فاتورة',
    transparent_eur_price: 'سعر شفاف باليورو',
    insurance: 'التأمين',
    ppe: 'معدات الحماية',
    city_reporting_route: 'قناة إبلاغ البلدية',
    partner_organizer: 'منظم شريك',
    safeguarding: 'الحماية',
    informed_consent: 'الموافقة المستنيرة',
    no_work_conditioned_reward: 'لا مكافأة مشروطة بالعمل',
  },
};

export default function ActivitiesPage() {
  const [locale, setLocale] = useLocale();
  const text = copy[locale];

  return (
    <main className="activities-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <a className="skip-link" href="#activity-content">
        {locale === 'fr'
          ? 'Aller au contenu'
          : locale === 'en'
            ? 'Skip to content'
            : 'الانتقال إلى المحتوى'}
      </a>
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

      <section className="activities-shell" id="activity-content">
        <div className="activities-intro">
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
        </div>
        <section
          className="activity-disabled"
          aria-labelledby="activity-disabled-title"
        >
          <Ban aria-hidden="true" />
          <div>
            <h2 id="activity-disabled-title">{text.disabledTitle}</h2>
            <p>{text.disabled}</p>
          </div>
        </section>

        <section
          className="activity-process"
          aria-labelledby="activity-process-title"
        >
          <h2 id="activity-process-title">{text.processTitle}</h2>
          <ol>
            {text.process.map((step, index) => (
              <li key={step} aria-current={index === 2 ? 'step' : undefined}>
                <span>{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section
          className="activity-register"
          aria-labelledby="activity-register-title"
        >
          <h2 id="activity-register-title">{text.ideasTitle}</h2>
          <div className="activity-grid">
            {register.ideas.map((idea) => (
              <article key={idea.id}>
                <div className="activity-card-status">
                  <span>
                    <CircleDotDashed size={16} aria-hidden="true" />
                    {text.status}
                  </span>
                  <strong>
                    <Ban size={15} aria-hidden="true" />
                    {text.noActivation}
                  </strong>
                </div>
                <h3>{idea.title[locale]}</h3>
                <p>{idea.value[locale]}</p>
                <dl>
                  <div>
                    <dt>{text.classification}</dt>
                    <dd>{text.classifications[idea.classification]}</dd>
                  </div>
                  <div>
                    <dt>{text.compensation}</dt>
                    <dd>{text.compensations[idea.compensation]}</dd>
                  </div>
                </dl>
                <h4>{text.gates}</h4>
                <ul>
                  {idea.required_gates.map((gate) => (
                    <li key={gate}>
                      <span>{gateLabels[locale][gate] ?? gate}</span>
                      <small>{text.gatePending}</small>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section
          className="activity-rules"
          aria-labelledby="activity-rules-title"
        >
          <Scale aria-hidden="true" />
          <div>
            <h2 id="activity-rules-title">{text.rulesTitle}</h2>
            <ul>
              {text.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        </section>
        <section
          className="activity-next"
          aria-labelledby="activity-next-title"
        >
          <ShieldCheck aria-hidden="true" />
          <div>
            <h2 id="activity-next-title">{text.nextTitle}</h2>
            <p>{text.next}</p>
          </div>
        </section>
        <p className="activity-updated">
          {text.updated}:{' '}
          <time dateTime={register.updated_at}>{register.updated_at}</time>
        </p>
      </section>
    </main>
  );
}
