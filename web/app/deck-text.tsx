import { Fragment } from 'react';
import { lookup, plural, type DeckKey } from './deck';
import type { Locale } from './use-locale';

/** Deck string as an element; an en fallback inside an RTL page is isolated (lang/dir) so its
 *  punctuation does not jump to the wrong end. `vars` are wrapped in <bdi dir="ltr">. */
export function T({ locale, k, vars, count }: { locale: Locale; k: DeckKey; vars?: Record<string, string>; count?: number }) {
  const { fallback } = lookup(locale, k);
  const raw = count === undefined ? lookup(locale, k).text : plural(locale, k, count);
  const all: Record<string, string> = { ...vars, ...(count === undefined ? {} : { '#': String(count) }) };
  const parts = raw.split(/(\{[a-zA-Z]+\}|#)/);
  const body = parts.map((p, i) => {
    const name = p === '#' ? '#' : p.startsWith('{') ? p.slice(1, -1) : null;
    return name && name in all ? <bdi dir="ltr" key={i}>{all[name]}</bdi> : <Fragment key={i}>{p}</Fragment>;
  });
  return fallback ? <span lang="en" dir="ltr">{body}</span> : <>{body}</>;
}
