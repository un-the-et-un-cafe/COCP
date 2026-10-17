import { clsx, type ClassValue } from 'clsx';

/** Class join. tailwind-merge was dropped for bundle size (~7 KB gz on /corrections/): no call
 *  site passes a conflicting Tailwind utility, so merging was a no-op. Pass non-conflicting
 *  classes only. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
