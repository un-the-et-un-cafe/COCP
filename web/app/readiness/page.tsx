'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Languages,
  LockKeyhole,
  ShieldAlert,
} from 'lucide-react';
import gateData from '@/data/launch-gates.json';
import { useLocale, type Locale } from '../use-locale';

type LaunchGate = {
  id: string;
  title: Record<Locale, string>;
  owner_roles: string[];
  status: 'pending' | 'blocked' | 'passed';
  pass_condition: Record<Locale, string>;
  implemented_controls: string[];
  evidence: Array<{ label: string; url: string }>;
  expires_at: string | null;
};

const register = gateData as unknown as {
  updated_at: string;
  launch_state: 'blocked' | 'ready';
  operational_activation: boolean;
  payment_lanes: { card: boolean; sepa: boolean; base: boolean };
  gates: LaunchGate[];
};

const copy = {
  fr: {
    brandNote: 'État de préparation',
    back: 'Retour au répertoire',
    language: 'Langue',
    eyebrow: 'Registre de lancement',
    title: 'Le prototype est public; le lancement opérationnel reste bloqué',
    intro:
      'Une mise en ligne technique ne vaut pas approbation juridique, humaine ou financière. Ce registre rend visibles les décisions encore nécessaires sans publier de données personnelles d’approbateurs.',
    blockedTitle: 'Activation opérationnelle interdite',
    blocked:
      'Aucun paiement ni activité ne peut être activé tant que chaque contrôle G1 à G9 n’est pas approuvé, documenté et non expiré.',
    progress: 'contrôles approuvés',
    remaining: 'contrôles bloquants',
    lanes: 'Voies de paiement',
    closed: 'Fermée',
    owner: 'Responsables requis',
    condition: 'Condition de réussite',
    controls: 'Contrôles techniques déjà présents',
    controlsNote:
      'Ils réduisent le risque mais ne remplacent pas l’approbation.',
    evidence: 'Preuves publiques',
    noEvidence: 'Aucune preuve d’approbation publiée',
    pending: 'En attente',
    passed: 'Approuvé',
    roles: {
      association_lead: 'Responsable associatif',
      fiscal_host: 'Hôte fiscal',
      accountant_or_counsel: 'Comptable ou conseil',
      provider_reviewer: 'Relecteur prestataire',
      independent_provider_reviewer: 'Deuxième relecteur indépendant',
      human_language_reviewer: 'Relecteur linguistique humain',
      technical_owner: 'Responsable technique',
      partner_facilitator: 'Facilitateur partenaire',
      founder: 'Fondateur',
      payment_operator: 'Opérateur de paiement',
      association_or_operator: 'Association ou opérateur',
      labour_adviser: 'Conseil en droit du travail',
      independent_reviewer: 'Relecteur indépendant',
      independent_contract_reviewer: 'Auditeur indépendant du contrat',
      independent_witness: 'Témoin indépendant',
    },
    updated: 'Registre mis à jour',
  },
  en: {
    brandNote: 'Readiness status',
    back: 'Back to directory',
    language: 'Language',
    eyebrow: 'Launch register',
    title: 'The prototype is public; operational launch remains blocked',
    intro:
      'Technical publication is not legal, human or financial approval. This register makes the outstanding decisions visible without publishing approvers’ personal data.',
    blockedTitle: 'Operational activation prohibited',
    blocked:
      'No payment or activity can be activated until every G1–G9 gate is approved, evidenced and unexpired.',
    progress: 'gates approved',
    remaining: 'gates blocking launch',
    lanes: 'Payment lanes',
    closed: 'Closed',
    owner: 'Required owners',
    condition: 'Pass condition',
    controls: 'Technical controls already present',
    controlsNote: 'They reduce risk but do not replace approval.',
    evidence: 'Public evidence',
    noEvidence: 'No approval evidence published',
    pending: 'Pending',
    passed: 'Passed',
    roles: {
      association_lead: 'Association lead',
      fiscal_host: 'Fiscal host',
      accountant_or_counsel: 'Accountant or counsel',
      provider_reviewer: 'Provider reviewer',
      independent_provider_reviewer: 'Second independent provider reviewer',
      human_language_reviewer: 'Human language reviewer',
      technical_owner: 'Technical owner',
      partner_facilitator: 'Partner facilitator',
      founder: 'Founder',
      payment_operator: 'Payment operator',
      association_or_operator: 'Association or operator',
      labour_adviser: 'Labour adviser',
      independent_reviewer: 'Independent reviewer',
      independent_contract_reviewer: 'Independent contract reviewer',
      independent_witness: 'Independent witness',
    },
    updated: 'Register updated',
  },
  ar: {
    brandNote: 'حالة الجاهزية',
    back: 'العودة إلى الدليل',
    language: 'اللغة',
    eyebrow: 'سجل الإطلاق',
    title: 'النموذج متاح للعامة لكن الإطلاق التشغيلي ما زال محظوراً',
    intro:
      'النشر التقني لا يعني موافقة قانونية أو بشرية أو مالية. يوضح هذا السجل القرارات المتبقية دون نشر بيانات شخصية للموافقين.',
    blockedTitle: 'التفعيل التشغيلي محظور',
    blocked:
      'لا يمكن تفعيل أي دفع أو نشاط حتى تتم الموافقة على جميع ضوابط G1 إلى G9 وتوثيقها والتأكد من عدم انتهاء صلاحيتها.',
    progress: 'ضوابط معتمدة',
    remaining: 'ضوابط تمنع الإطلاق',
    lanes: 'مسارات الدفع',
    closed: 'مغلق',
    owner: 'المسؤولون المطلوبون',
    condition: 'شرط النجاح',
    controls: 'الضوابط التقنية الموجودة',
    controlsNote: 'تقلل المخاطر لكنها لا تحل محل الموافقة.',
    evidence: 'الأدلة العامة',
    noEvidence: 'لا توجد أدلة موافقة منشورة',
    pending: 'قيد الانتظار',
    passed: 'معتمد',
    roles: {
      association_lead: 'مسؤول جمعية',
      fiscal_host: 'المضيف المالي',
      accountant_or_counsel: 'محاسب أو مستشار',
      provider_reviewer: 'مراجع مقدم خدمة',
      independent_provider_reviewer: 'مراجع مستقل ثانٍ',
      human_language_reviewer: 'مراجع لغوي بشري',
      technical_owner: 'المسؤول التقني',
      partner_facilitator: 'ميسر شريك',
      founder: 'المؤسس',
      payment_operator: 'مشغل الدفع',
      association_or_operator: 'جمعية أو مشغل',
      labour_adviser: 'مستشار قانون العمل',
      independent_reviewer: 'مراجع مستقل',
      independent_contract_reviewer: 'مراجع عقد مستقل',
      independent_witness: 'شاهد مستقل',
    },
    updated: 'تحديث السجل',
  },
} as const;

export default function ReadinessPage() {
  const [locale, setLocale] = useLocale();
  const text = copy[locale];
  const passed = register.gates.filter(
    (gate) => gate.status === 'passed',
  ).length;

  return (
    <main className="readiness-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <a className="skip-link" href="#readiness-content">
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

      <section className="readiness-shell" id="readiness-content">
        <div className="readiness-intro">
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
        </div>
        <section
          className="readiness-blocked"
          aria-labelledby="readiness-blocked-title"
        >
          <ShieldAlert aria-hidden="true" />
          <div>
            <h2 id="readiness-blocked-title">{text.blockedTitle}</h2>
            <p>{text.blocked}</p>
          </div>
        </section>

        <dl className="readiness-summary">
          <div>
            <dt>{text.progress}</dt>
            <dd>
              {passed}/{register.gates.length}
            </dd>
          </div>
          <div>
            <dt>{text.remaining}</dt>
            <dd>{register.gates.length - passed}</dd>
          </div>
          <div>
            <dt>{text.lanes}</dt>
            <dd>
              {Object.entries(register.payment_lanes).map(([lane]) => (
                <span key={lane}>
                  <LockKeyhole size={14} aria-hidden="true" />
                  {lane.toUpperCase()}: {text.closed}
                </span>
              ))}
            </dd>
          </div>
        </dl>

        <section className="gate-register" aria-label={text.eyebrow}>
          {register.gates.map((gate) => (
            <article key={gate.id}>
              <div className="gate-heading">
                <span className="gate-id">{gate.id}</span>
                <span className={`gate-status ${gate.status}`}>
                  {gate.status === 'passed' ? (
                    <CheckCircle2 size={15} aria-hidden="true" />
                  ) : (
                    <CircleDashed size={15} aria-hidden="true" />
                  )}
                  {gate.status === 'passed' ? text.passed : text.pending}
                </span>
              </div>
              <h2>{gate.title[locale]}</h2>
              <dl>
                <div>
                  <dt>{text.owner}</dt>
                  <dd>
                    {gate.owner_roles
                      .map(
                        (role) =>
                          text.roles[role as keyof typeof text.roles] ?? role,
                      )
                      .join(' · ')}
                  </dd>
                </div>
                <div>
                  <dt>{text.condition}</dt>
                  <dd>{gate.pass_condition[locale]}</dd>
                </div>
                <div>
                  <dt>{text.controls}</dt>
                  <dd>
                    {gate.implemented_controls.length} — {text.controlsNote}
                  </dd>
                </div>
                <div>
                  <dt>{text.evidence}</dt>
                  <dd>
                    {gate.evidence.length === 0
                      ? text.noEvidence
                      : gate.evidence.map((item) => (
                          <a
                            key={item.url}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.label}
                          </a>
                        ))}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
        <p className="readiness-updated">
          {text.updated}:{' '}
          <time dateTime={register.updated_at}>{register.updated_at}</time>
        </p>
      </section>
    </main>
  );
}
