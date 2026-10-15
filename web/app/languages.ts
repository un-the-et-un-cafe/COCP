import { RTL } from './use-locale';

/** Language registry (design-system.md "Languages"). Structure only: ps, fa, ti, ckb and kmr
 *  are NOT enabled — their copy is "TODO human translator" in COCP-Copy-Deck-v0.3 and every
 *  translation needs a native-speaker check before release. */
export const LANGUAGES = [
  { code: 'fr', native: 'Français', enabled: true },
  { code: 'en', native: 'English', enabled: true },
  { code: 'ar', native: 'العربية', enabled: true },
  { code: 'ps', native: 'پښتو', enabled: false },
  { code: 'fa', native: 'فارسی', enabled: false },
  { code: 'ti', native: 'ትግርኛ', enabled: false },
  { code: 'ckb', native: 'کوردی', enabled: false },
  { code: 'kmr', native: 'Kurmancî', enabled: false },
] as const;

export const languageDir = (code: string) => (RTL.has(code) ? 'rtl' : 'ltr');
