'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Database,
  ExternalLink,
  Languages,
  LockKeyhole,
  MapPinned,
  MessageSquareWarning,
} from 'lucide-react';
import { useLocale, type Locale } from '../use-locale';

const copy = {
  fr: {
    brandNote: 'Vie privée et données',
    back: 'Retour au répertoire',
    language: 'Langue',
    eyebrow: 'Confidentialité',
    title: 'Ce que le service traite — et ce qu’il ne collecte pas',
    intro:
      'Le répertoire peut être consulté sans compte. Cette notice décrit le fonctionnement actuel du prototype public et distingue les données du service des traitements techniques de ses hébergeurs.',
    summaryTitle: 'Aucun profil de bénéficiaire',
    summary:
      'Le service ne demande ni nom, ni e-mail, ni statut administratif, ni position en direct. Il ne contient pas de publicité, d’outil d’analyse comportementale, de portefeuille ou de paiement.',
    sections: [
      {
        title: 'Préférence de langue',
        body: 'Le choix français, anglais ou arabe est enregistré uniquement dans le stockage local du navigateur sous la clé cocp-locale. Il reste sur l’appareil jusqu’à son effacement et n’est pas envoyé à la base de données.',
      },
      {
        title: 'État du répertoire',
        body: 'Le navigateur consulte Convex pour afficher l’environnement, le nombre de fiches, l’empreinte de la source et l’heure de synchronisation. Cette réponse ne contient aucune donnée personnelle.',
      },
      {
        title: 'Signalements de correction',
        body: 'L’envoi est facultatif. Le formulaire transmet la fiche, le type de correction, la langue et un message de 10 à 800 caractères. N’ajoutez aucune donnée personnelle. Le message est conservé dans Convex pendant 30 jours au maximum, puis une tâche quotidienne le supprime, même après modération.',
      },
      {
        title: 'Protection contre les abus et hébergement',
        body: 'Netlify applique une limite de débit à l’entrée des corrections à partir de l’adresse IP et du domaine. L’application n’enregistre pas ces données réseau dans sa base, mais Netlify, Convex et les réseaux de diffusion peuvent traiter des journaux techniques selon leurs propres obligations de sécurité et de conservation.',
      },
      {
        title: 'Liens externes',
        body: 'Les appels téléphoniques et les cartes OpenStreetMap quittent ce service. Aucune carte n’est intégrée et aucune géolocalisation n’est demandée. La politique de référent limite l’information envoyée aux sites externes à l’origine du site.',
      },
      {
        title: 'Sponsors et paiements',
        body: 'Les paiements sont désactivés. Le registre sponsor ne publie que des montants agrégés et des preuves examinées. Il rejette les champs personnels, les portefeuilles, les références et toute reconnaissance sans consentement valable.',
      },
    ],
    retentionTitle: 'Résumé de conservation',
    retentionRows: [
      ['Consultation du répertoire', 'Aucun profil applicatif'],
      ['Préférence de langue', 'Sur l’appareil, jusqu’à effacement'],
      ['Correction anonyme', '30 jours au maximum'],
      ['Fiches et registre publics', 'Historique public versionné'],
    ],
    contactTitle: 'Questions et demandes',
    contact:
      'L’entité responsable et un contact privé dédié doivent encore être approuvés avant le lancement complet. En attendant, le suivi du code source est public : ne l’utilisez jamais pour une demande contenant des données personnelles ou des informations liées à un dossier individuel.',
    contactLink: 'Consulter le suivi public',
    updated: 'Dernière mise à jour',
  },
  en: {
    brandNote: 'Privacy and data use',
    back: 'Back to directory',
    language: 'Language',
    eyebrow: 'Privacy',
    title: 'What the service processes — and what it does not collect',
    intro:
      'The directory can be used without an account. This notice describes the current public prototype and distinguishes application data from technical processing by its hosting providers.',
    summaryTitle: 'No beneficiary profile',
    summary:
      'The service does not ask for a name, email address, immigration status or live location. It contains no advertising, behavioural analytics, wallet or payment collection.',
    sections: [
      {
        title: 'Language preference',
        body: 'The French, English or Arabic choice is stored only in browser local storage under the cocp-locale key. It remains on the device until cleared and is not sent to the database.',
      },
      {
        title: 'Directory status',
        body: 'The browser asks Convex for the environment, listing count, source fingerprint and synchronization time. This response contains no personal data.',
      },
      {
        title: 'Correction reports',
        body: 'Submission is optional. The form sends the listing, correction type, language and a message between 10 and 800 characters. Do not add personal data. Convex retains the message for no more than 30 days, after which a daily task deletes it even if it has been moderated.',
      },
      {
        title: 'Abuse protection and hosting',
        body: 'Netlify rate-limits correction intake using IP address and domain. The application does not store this network data in its database, but Netlify, Convex and content-delivery networks may process technical logs under their own security and retention obligations.',
      },
      {
        title: 'External links',
        body: 'Telephone calls and OpenStreetMap links leave this service. No map is embedded and no geolocation is requested. The referrer policy limits information sent to external sites to the site origin.',
      },
      {
        title: 'Sponsors and payments',
        body: 'Payments are disabled. The sponsor ledger publishes only aggregate amounts and reviewed evidence. It rejects personal, wallet, referral and identifier fields, and any recognition without valid consent.',
      },
    ],
    retentionTitle: 'Retention summary',
    retentionRows: [
      ['Directory browsing', 'No application profile'],
      ['Language preference', 'On the device until cleared'],
      ['Anonymous correction', 'No more than 30 days'],
      ['Public listings and ledger', 'Versioned public history'],
    ],
    contactTitle: 'Questions and requests',
    contact:
      'The responsible entity and a dedicated private contact still require approval before full launch. Until then, the source-code tracker is public: never use it for a request containing personal data or information about an individual case.',
    contactLink: 'View the public tracker',
    updated: 'Last updated',
  },
  ar: {
    brandNote: 'الخصوصية واستخدام البيانات',
    back: 'العودة إلى الدليل',
    language: 'اللغة',
    eyebrow: 'الخصوصية',
    title: 'ما الذي تعالجه الخدمة وما الذي لا تجمعه',
    intro:
      'يمكن استخدام الدليل دون حساب. يوضح هذا الإشعار عمل النموذج العام الحالي ويفصل بين بيانات التطبيق والمعالجة التقنية لدى مزودي الاستضافة.',
    summaryTitle: 'لا يوجد ملف شخصي للمستفيد',
    summary:
      'لا تطلب الخدمة اسماً أو بريداً إلكترونياً أو وضع الهجرة أو الموقع المباشر. ولا تتضمن إعلانات أو تحليلات سلوكية أو محفظة أو تحصيل مدفوعات.',
    sections: [
      {
        title: 'تفضيل اللغة',
        body: 'يُحفظ اختيار الفرنسية أو الإنجليزية أو العربية في التخزين المحلي للمتصفح فقط تحت المفتاح cocp-locale. يبقى على الجهاز حتى حذفه ولا يُرسل إلى قاعدة البيانات.',
      },
      {
        title: 'حالة الدليل',
        body: 'يطلب المتصفح من Convex اسم البيئة وعدد السجلات وبصمة المصدر ووقت المزامنة. ولا تتضمن هذه الاستجابة بيانات شخصية.',
      },
      {
        title: 'بلاغات التصحيح',
        body: 'الإرسال اختياري. يرسل النموذج السجل ونوع التصحيح واللغة ورسالة من 10 إلى 800 حرف. لا تضف بيانات شخصية. تحتفظ Convex بالرسالة لمدة لا تتجاوز 30 يوماً، ثم تحذفها مهمة يومية حتى إذا تمت مراجعتها.',
      },
      {
        title: 'الحماية من الإساءة والاستضافة',
        body: 'تحد Netlify من معدل بلاغات التصحيح باستخدام عنوان IP والنطاق. لا يخزن التطبيق هذه البيانات الشبكية في قاعدة بياناته، لكن Netlify وConvex وشبكات توزيع المحتوى قد تعالج سجلات تقنية وفق التزاماتها الأمنية وسياسات الاحتفاظ الخاصة بها.',
      },
      {
        title: 'الروابط الخارجية',
        body: 'تغادر المكالمات الهاتفية وروابط OpenStreetMap هذه الخدمة. لا توجد خريطة مدمجة ولا يُطلب تحديد الموقع. تحد سياسة الإحالة المعلومات المرسلة إلى المواقع الخارجية بأصل الموقع.',
      },
      {
        title: 'الرعاة والمدفوعات',
        body: 'المدفوعات معطلة. لا ينشر سجل الرعاة إلا مبالغ مجمعة وأدلة تمت مراجعتها. ويرفض الحقول الشخصية والمحافظ والإحالات والمعرفات وأي تقدير دون موافقة سارية.',
      },
    ],
    retentionTitle: 'ملخص الاحتفاظ',
    retentionRows: [
      ['تصفح الدليل', 'لا يوجد ملف شخصي في التطبيق'],
      ['تفضيل اللغة', 'على الجهاز حتى الحذف'],
      ['تصحيح مجهول', '30 يوماً كحد أقصى'],
      ['السجلات العامة وسجل الرعاة', 'سجل عام بإصدارات'],
    ],
    contactTitle: 'الأسئلة والطلبات',
    contact:
      'لا تزال الجهة المسؤولة وقناة اتصال خاصة ومخصصة بحاجة إلى الاعتماد قبل الإطلاق الكامل. وحتى ذلك الحين، فإن متتبع الشفرة علني، فلا تستخدمه أبداً لطلب يحتوي على بيانات شخصية أو معلومات عن حالة فردية.',
    contactLink: 'عرض المتتبع العام',
    updated: 'آخر تحديث',
  },
} as const;

const sectionIcons = [
  Languages,
  Database,
  MessageSquareWarning,
  LockKeyhole,
  MapPinned,
  LockKeyhole,
];

export default function PrivacyPage() {
  const [locale, setLocale] = useLocale();
  const text = copy[locale];

  return (
    <main className="privacy-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <a className="skip-link" href="#privacy-content">
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

      <section className="privacy-shell" id="privacy-content">
        <div className="privacy-intro">
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
        </div>

        <section
          className="privacy-summary"
          aria-labelledby="privacy-summary-title"
        >
          <LockKeyhole aria-hidden="true" />
          <div>
            <h2 id="privacy-summary-title">{text.summaryTitle}</h2>
            <p>{text.summary}</p>
          </div>
        </section>

        <div className="privacy-grid">
          {text.sections.map((section, index) => {
            const Icon = sectionIcons[index];
            return (
              <article key={section.title}>
                <Icon aria-hidden="true" />
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </article>
            );
          })}
        </div>

        <section
          className="retention-section"
          aria-labelledby="retention-title"
        >
          <h2 id="retention-title">{text.retentionTitle}</h2>
          <dl>
            {text.retentionRows.map(([item, duration]) => (
              <div key={item}>
                <dt>{item}</dt>
                <dd>{duration}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className="privacy-contact"
          aria-labelledby="privacy-contact-title"
        >
          <h2 id="privacy-contact-title">{text.contactTitle}</h2>
          <p>{text.contact}</p>
          <a
            href="https://github.com/un-the-et-un-cafe/COCP/issues"
            target="_blank"
            rel="noreferrer"
          >
            {text.contactLink}
            <ExternalLink size={17} aria-hidden="true" />
          </a>
        </section>

        <p className="privacy-updated">
          {text.updated}: <time dateTime="2026-09-16">16/09/2026</time>
        </p>
      </section>
    </main>
  );
}
