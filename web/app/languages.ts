import { RTL } from './use-locale';

/** Language registry (design-system.md "Languages"). Structure only: ps, fa, ti, ckb and kmr
 *  are NOT enabled — their copy is "TODO human translator" in COCP-Copy-Deck-v0.3 and every
 *  translation needs a native-speaker check before release. */
export const LANGUAGES = [
  { code: 'fr', glyph: 'Aa', native: 'Français', enabled: true },
  { code: 'en', glyph: 'Aa', native: 'English', enabled: true },
  { code: 'ar', glyph: 'ع', native: 'العربية', enabled: true },
  { code: 'ps', glyph: 'پ', native: 'پښتو', enabled: false },
  { code: 'fa', glyph: 'ف', native: 'فارسی', enabled: false },
  { code: 'ti', glyph: 'ት', native: 'ትግርኛ', enabled: false },
  { code: 'ckb', glyph: 'ک', native: 'کوردی', enabled: false },
  { code: 'kmr', glyph: 'Aa', native: 'Kurmancî', enabled: false },
] as const;

export const languageDir = (code: string) => (RTL.has(code) ? 'rtl' : 'ltr');
