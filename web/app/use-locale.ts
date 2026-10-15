'use client';

import { useEffect, useSyncExternalStore } from 'react';

export type Locale = 'fr' | 'en' | 'ar';

/** Right-to-left scripts. ps (Pashto), fa (Persian) and ckb (Sorani Kurdish) are prepared for future
 *  locales; they are NOT enabled until translations pass human review. */
export const RTL = new Set<string>(['ar', 'ps', 'fa', 'ckb']);
export const isRtl = (locale: string) => RTL.has(locale);

const localeEvent = 'cocp-locale-change';

function getLocaleSnapshot(): Locale {
  const saved = localStorage.getItem('cocp-locale');
  return saved === 'fr' || saved === 'en' || saved === 'ar' ? saved : 'fr';
}

function subscribeLocale(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(localeEvent, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(localeEvent, callback);
  };
}

export function setLocale(locale: Locale) {
  localStorage.setItem('cocp-locale', locale);
  window.dispatchEvent(new Event(localeEvent));
}

export function useLocale() {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    (): Locale => 'fr',
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr';
  }, [locale]);

  return [locale, setLocale] as const;
}
