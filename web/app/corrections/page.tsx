'use client';

import { useCallback, useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import listings from '@/data/listings.json';

type Language = 'fr' | 'en' | 'ar';
type ReportType = 'hours' | 'location' | 'contact' | 'service' | 'closed' | 'safety' | 'other';
type CorrectionPayload = { listingId: string; reportType: ReportType; message: string; language: Language; privacyConfirmed: boolean; website?: string };
type ToolDefinition = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute(input: unknown): Promise<unknown> };

declare global {
  interface Document { readonly modelContext?: { registerTool(tool: ToolDefinition, options?: { signal?: AbortSignal }): void | Promise<void> } }
}

const copy = {
  fr: { title: 'Signaler une correction', intro: 'Aidez le service concerné à vérifier une information. Ne donnez aucun nom de personne, statut administratif, dossier, lieu de vie précis ou autre donnée privée.', service: 'Service concerné', type: 'Information à corriger', message: 'Que faut-il vérifier ?', placeholder: 'Décrivez uniquement l’information publique qui semble incorrecte…', confirm: 'Je confirme que ce message ne contient aucune information personnelle ou liée à un dossier individuel.', submit: 'Envoyer pour modération', sending: 'Envoi…', success: 'Merci. Le signalement a été placé dans la file de modération.', back: 'Retour au répertoire', language: 'Langue du signalement' },
  en: { title: 'Report a correction', intro: 'Help the relevant provider verify public information. Do not include anyone’s name, immigration status, case details, precise living location, or other private data.', service: 'Service concerned', type: 'Information to correct', message: 'What should be checked?', placeholder: 'Describe only the public information that appears incorrect…', confirm: 'I confirm this message contains no personal information or individual case details.', submit: 'Send for moderation', sending: 'Sending…', success: 'Thank you. The report has entered the moderation queue.', back: 'Back to directory', language: 'Report language' },
  ar: { title: 'الإبلاغ عن تصحيح', intro: 'ساعد الجهة المعنية على التحقق من المعلومات العامة. لا تذكر أسماء أشخاص أو وضع الهجرة أو تفاصيل الملفات أو مكان السكن الدقيق أو أي بيانات خاصة.', service: 'الخدمة المعنية', type: 'المعلومة المطلوب تصحيحها', message: 'ما الذي يجب التحقق منه؟', placeholder: 'صف فقط المعلومات العامة التي تبدو غير صحيحة…', confirm: 'أؤكد أن هذه الرسالة لا تحتوي على معلومات شخصية أو تفاصيل حالة فردية.', submit: 'إرسال للمراجعة', sending: 'جارٍ الإرسال…', success: 'شكراً. أُضيف البلاغ إلى قائمة المراجعة.', back: 'العودة إلى الدليل', language: 'لغة البلاغ' },
} as const;

const typeLabels: Record<Language, Record<ReportType, string>> = {
  fr: { hours: 'Horaires', location: 'Lieu', contact: 'Contact', service: 'Service proposé', closed: 'Service fermé', safety: 'Problème urgent de sécurité', other: 'Autre information' },
  en: { hours: 'Opening times', location: 'Location', contact: 'Contact', service: 'Service offered', closed: 'Service closed', safety: 'Urgent safety issue', other: 'Other information' },
  ar: { hours: 'المواعيد', location: 'الموقع', contact: 'التواصل', service: 'الخدمة المقدمة', closed: 'الخدمة مغلقة', safety: 'مشكلة سلامة عاجلة', other: 'معلومة أخرى' },
};

async function postCorrection(payload: CorrectionPayload) {
  const response = await fetch('/api/corrections', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  const result = await response.json() as { reportId?: string; error?: string };
  if (!response.ok) throw new Error(result.error ?? 'Unable to submit correction.');
  return result;
}

export default function CorrectionsPage() {
  const initialListing = useMemo(() => listings[0].id, []);
  const [language, setLanguage] = useState<Language>('fr');
  const [listingId, setListingId] = useState(initialListing);
  const [reportType, setReportType] = useState<ReportType>('hours');
  const [message, setMessage] = useState('');
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const text = copy[language];

  useEffect(() => {
    const requestedListing = new URLSearchParams(window.location.search).get('listing') ?? '';
    const frame = window.requestAnimationFrame(() => {
      if (listings.some((item) => item.id === requestedListing)) setListingId(requestedListing);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const submitCorrection = useCallback(async (payload: CorrectionPayload) => {
    setState('sending');
    setError('');
    try {
      const result = await postCorrection(payload);
      setListingId(payload.listingId);
      setReportType(payload.reportType);
      setMessage(payload.message);
      setLanguage(payload.language);
      setPrivacyConfirmed(payload.privacyConfirmed);
      setState('success');
      return { reportId: result.reportId, status: 'submitted' };
    } catch (caught) {
      const reason = caught instanceof Error ? caught.message : 'Unable to submit correction.';
      setError(reason);
      setState('error');
      throw new Error(reason);
    }
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const reportTypeEnum = Object.keys(typeLabels.fr);
    void Promise.resolve(context.registerTool({
      name: 'submit_service_correction',
      title: 'Submit service correction',
      description: 'Submit a bounded correction about public service information to the moderation queue. Never include personal or individual case data.',
      inputSchema: { type: 'object', properties: { listingId: { type: 'string', enum: listings.map((item) => item.id) }, reportType: { type: 'string', enum: reportTypeEnum }, message: { type: 'string', minLength: 10, maxLength: 800 }, language: { type: 'string', enum: ['fr', 'en', 'ar'] }, privacyConfirmed: { const: true } }, required: ['listingId', 'reportType', 'message', 'language', 'privacyConfirmed'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: (input) => submitCorrection(input as CorrectionPayload),
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [submitCorrection]);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitCorrection({ listingId, reportType, message, language, privacyConfirmed, website }).catch(() => undefined);
  }

  return (
    <main dir={language === 'ar' ? 'rtl' : 'ltr'} className="correction-page">
      <header className="site-header"><Link className="brand-block brand-home" href="/"><span className="brand-mark" aria-hidden="true">C</span><div><p className="brand-name">Calais Open Commons</p><p className="brand-note">Correction anonyme</p></div></Link><Link className="directory-link" href="/"><ArrowLeft size={18} aria-hidden="true" />{text.back}</Link></header>
      <section className="correction-shell">
        <div className="correction-intro"><p className="eyebrow">Information publique uniquement</p><h1>{text.title}</h1><p>{text.intro}</p><div className="privacy-line"><ShieldCheck size={20} aria-hidden="true" />Aucun nom, e-mail, numéro personnel ou compte n’est demandé.</div></div>
        <form className="correction-form" onSubmit={handleSubmit}>
          <label>{text.language}<NativeSelect value={language} onChange={(event) => setLanguage(event.target.value as Language)}><NativeSelectOption value="fr">Français</NativeSelectOption><NativeSelectOption value="en">English</NativeSelectOption><NativeSelectOption value="ar">العربية</NativeSelectOption></NativeSelect></label>
          <label>{text.service}<NativeSelect value={listingId} onChange={(event) => setListingId(event.target.value)}>{listings.map((listing) => <NativeSelectOption key={listing.id} value={listing.id}>{listing.name}</NativeSelectOption>)}</NativeSelect></label>
          <label>{text.type}<NativeSelect value={reportType} onChange={(event) => setReportType(event.target.value as ReportType)}>{Object.entries(typeLabels[language]).map(([value, label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}</NativeSelect></label>
          <label>{text.message}<Textarea minLength={10} maxLength={800} required value={message} onChange={(event) => setMessage(event.target.value)} placeholder={text.placeholder} /><span className="character-count">{message.length}/800</span></label>
          <label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
          <label className="privacy-confirm"><Checkbox checked={privacyConfirmed} onCheckedChange={(checked) => setPrivacyConfirmed(checked === true)} /><span>{text.confirm}</span></label>
          <Button className="submit-correction" type="submit" disabled={!privacyConfirmed || message.trim().length < 10 || state === 'sending'}>{state === 'sending' ? text.sending : text.submit}</Button>
          {state === 'success' ? <output className="form-result success"><CheckCircle2 aria-hidden="true" />{text.success}</output> : null}
          {state === 'error' ? <output className="form-result error"><AlertTriangle aria-hidden="true" />{error}</output> : null}
        </form>
      </section>
    </main>
  );
}
