'use client';

import { useEffect, useSyncExternalStore } from 'react';

export type Locale = 'fr' | 'en' | 'ar';

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
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  return [locale, setLocale] as const;
}
