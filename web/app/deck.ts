import deck from './deck.json';
import type { Locale } from './use-locale';

/** Copy Deck v0.3.3 lookup. fr and en are complete; other languages only carry keys a human
 *  translator has delivered (none yet for ar), otherwise we fall back to en and tell the caller,
 *  so the fallback can be rendered with lang="en" dir="ltr" (no machine translation). */
export type DeckKey = keyof typeof deck.fr;
const table = deck as unknown as Record<'fr' | 'en' | 'ar', Partial<Record<DeckKey, string>>>;

export function lookup(locale: Locale, key: DeckKey): { text: string; fallback: boolean } {
  const own = table[locale]?.[key];
  if (own) return { text: own, fallback: false };
  return { text: table.en[key] ?? `[copy: ${key}]`, fallback: locale !== 'en' };
}
export const tr = (locale: Locale, key: DeckKey) => lookup(locale, key).text;

/** Minimal ICU plural for `{count, plural, one {…} other {…}}` (fr: 0 and 1 are "one"). */
export function plural(locale: Locale, key: DeckKey, count: number) {
  const { text } = lookup(locale, key);
  const lang = table[locale]?.[key] ? locale : 'en';
  const one = lang === 'fr' ? count <= 1 : count === 1;
  const m = text.match(/one \{([^}]*)\} other \{([^}]*)\}/);
  return m ? (one ? m[1] : m[2]) : text;
}
