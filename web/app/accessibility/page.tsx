'use client';

import Link from 'next/link';
import {
  Accessibility,
  ArrowLeft,
  ExternalLink,
  Languages,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { useLocale, type Locale } from '../use-locale';

const copy = {
  fr: {
    brandNote: 'Accès clair et inclusif',
    back: 'Retour au répertoire',
    language: 'Langue',
    eyebrow: 'Accessibilité',
    title: 'État d’accessibilité du service',
    intro:
      'Cette page décrit ce qui est déjà en place, les limites connues et comment signaler un obstacle. Elle sera mise à jour à mesure des vérifications.',
    statusTitle: 'Audit indépendant en attente',
    status:
      'Aucune déclaration de conformité RGAA ou WCAG n’est faite à ce stade. Une revue automatique ne remplace pas un audit qualifié ni des essais avec des personnes handicapées.',
    measuresTitle: 'Mesures déjà mises en place',
    measures: [
      'Navigation sans compte, sans suivi publicitaire et sans obligation d’utiliser une souris.',
      'Lien d’accès rapide au contenu, repères sémantiques et indication visible du focus clavier.',
      'Langue et sens de lecture mis à jour pour le français, l’anglais et l’arabe.',
      'Contrôles d’au moins 44 pixels, textes redimensionnables et mouvement réduit selon la préférence du système.',
      'États de synchronisation et résultats de formulaire annoncés sans dépendre uniquement de la couleur.',
    ],
    limitsTitle: 'Limites connues',
    limits: [
      'Les textes français, anglais et arabes n’ont pas encore tous été relus par des linguistes ni adaptés en langage facile à comprendre.',
      'Les parcours n’ont pas encore fait l’objet d’un audit RGAA complet ni d’une matrice manuelle lecteur d’écran, zoom et commande vocale.',
      'Les liens cartographiques ouvrent des services externes dont l’accessibilité ne dépend pas de ce projet.',
      'Les fiches importées restent non vérifiées et peuvent contenir une formulation difficile ou incomplète.',
    ],
    feedbackTitle: 'Signaler un obstacle',
    feedback:
      'N’incluez aucune donnée personnelle ou information liée à un dossier individuel. Le canal temporaire est le suivi public du code source, en attendant l’approbation d’un contact d’accessibilité dédié.',
    feedbackLink: 'Ouvrir un signalement public',
    review: 'Dernière revue interne',
  },
  en: {
    brandNote: 'Clear and inclusive access',
    back: 'Back to directory',
    language: 'Language',
    eyebrow: 'Accessibility',
    title: 'Accessibility status of this service',
    intro:
      'This page records what is already in place, known limitations and how to report a barrier. It will be updated as reviews are completed.',
    statusTitle: 'Independent audit pending',
    status:
      'No RGAA or WCAG conformance claim is made at this stage. Automated review does not replace a qualified audit or testing with disabled people.',
    measuresTitle: 'Measures already in place',
    measures: [
      'Navigation without an account, advertising tracking or a requirement to use a mouse.',
      'A skip link, semantic landmarks and a clearly visible keyboard focus indicator.',
      'Document language and reading direction update for French, English and Arabic.',
      'Controls at least 44 pixels high, resizable text and reduced motion when requested by the operating system.',
      'Database and form states communicated without relying on colour alone.',
    ],
    limitsTitle: 'Known limitations',
    limits: [
      'French, English and Arabic content has not all been reviewed by linguists or adapted into easy-to-understand language.',
      'The journeys have not yet received a complete RGAA audit or a manual screen-reader, zoom and voice-control test matrix.',
      'Map links open external services whose accessibility is outside this project’s control.',
      'Imported service entries remain unverified and may contain difficult or incomplete wording.',
    ],
    feedbackTitle: 'Report a barrier',
    feedback:
      'Do not include personal data or information about an individual case. The public source-code tracker is the temporary channel until a dedicated accessibility contact is approved.',
    feedbackLink: 'Open a public report',
    review: 'Last internal review',
  },
  ar: {
    brandNote: 'وصول واضح وشامل',
    back: 'العودة إلى الدليل',
    language: 'اللغة',
    eyebrow: 'إمكانية الوصول',
    title: 'حالة إمكانية الوصول إلى هذه الخدمة',
    intro:
      'توضح هذه الصفحة ما تم تنفيذه والقيود المعروفة وكيفية الإبلاغ عن عائق، وسيتم تحديثها مع اكتمال المراجعات.',
    statusTitle: 'التدقيق المستقل قيد الانتظار',
    status:
      'لا ندّعي حالياً التوافق مع RGAA أو WCAG. ولا تحل المراجعة الآلية محل تدقيق مؤهل أو اختبار بمشاركة أشخاص ذوي إعاقة.',
    measuresTitle: 'التدابير المطبقة حالياً',
    measures: [
      'التصفح دون حساب أو تتبع إعلاني ودون اشتراط استخدام الفأرة.',
      'رابط لتجاوز الترويسة ومعالم دلالية ومؤشر واضح لتركيز لوحة المفاتيح.',
      'تحديث لغة المستند واتجاه القراءة للفرنسية والإنجليزية والعربية.',
      'عناصر تحكم بارتفاع 44 بكسل على الأقل ونص قابل للتكبير وتقليل الحركة حسب إعداد النظام.',
      'عرض حالة قاعدة البيانات والنماذج دون الاعتماد على اللون وحده.',
    ],
    limitsTitle: 'القيود المعروفة',
    limits: [
      'لم يراجع مختصون لغويون جميع النصوص الفرنسية والإنجليزية والعربية، ولم تُكيّف كلها إلى لغة سهلة الفهم.',
      'لم تخضع المسارات بعد لتدقيق RGAA كامل أو اختبارات يدوية شاملة لقارئ الشاشة والتكبير والتحكم الصوتي.',
      'تفتح روابط الخرائط خدمات خارجية لا يتحكم هذا المشروع في إمكانية الوصول إليها.',
      'تبقى سجلات الخدمات المستوردة غير متحقق منها وقد تتضمن صياغة صعبة أو ناقصة.',
    ],
    feedbackTitle: 'الإبلاغ عن عائق',
    feedback:
      'لا تذكر بيانات شخصية أو معلومات عن حالة فردية. متتبع الشفرة العام هو القناة المؤقتة إلى حين اعتماد جهة اتصال مخصصة لإمكانية الوصول.',
    feedbackLink: 'فتح بلاغ عام',
    review: 'آخر مراجعة داخلية',
  },
} as const;

export default function AccessibilityPage() {
  const [locale, setLocale] = useLocale();
  const text = copy[locale];

  return (
    <main className="accessibility-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <a className="skip-link" href="#accessibility-content">
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

      <section className="accessibility-shell" id="accessibility-content">
        <div className="accessibility-intro">
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
        </div>

        <section className="audit-status" aria-labelledby="audit-status-title">
          <TriangleAlert aria-hidden="true" />
          <div>
            <h2 id="audit-status-title">{text.statusTitle}</h2>
            <p>{text.status}</p>
          </div>
        </section>

        <div className="accessibility-grid">
          <section aria-labelledby="measures-title">
            <Accessibility aria-hidden="true" />
            <h2 id="measures-title">{text.measuresTitle}</h2>
            <ul>
              {text.measures.map((measure) => (
                <li key={measure}>{measure}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="limits-title">
            <ShieldCheck aria-hidden="true" />
            <h2 id="limits-title">{text.limitsTitle}</h2>
            <ul>
              {text.limits.map((limit) => (
                <li key={limit}>{limit}</li>
              ))}
            </ul>
          </section>
        </div>

        <section
          className="accessibility-feedback"
          aria-labelledby="feedback-title"
        >
          <h2 id="feedback-title">{text.feedbackTitle}</h2>
          <p>{text.feedback}</p>
          <a
            href="https://github.com/un-the-et-un-cafe/COCP/issues/new"
            target="_blank"
            rel="noreferrer"
          >
            {text.feedbackLink}
            <ExternalLink size={17} aria-hidden="true" />
          </a>
        </section>

        <p className="accessibility-review">
          {text.review}: <time dateTime="2026-09-16">16/09/2026</time>
        </p>
      </section>
    </main>
  );
}
