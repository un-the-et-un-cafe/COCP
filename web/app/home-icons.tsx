/** Inline copies of the lucide icons used on home (ISC licence, lucide.dev), to avoid the
 *  lucide runtime on the first load. Same 24×24 stroke geometry. */
type P = { size?: number; 'aria-hidden'?: boolean | 'true' };
function Svg({ size = 24, children }: { size?: number; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
export const AlertTriangle = ({ size }: P) => <Svg size={size}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></Svg>;
export const CheckCircle2 = ({ size }: P) => <Svg size={size}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></Svg>;
export const Clock3 = ({ size }: P) => <Svg size={size}><circle cx="12" cy="12" r="10" /><path d="M12 6v6h4" /></Svg>;
export const Database = ({ size }: P) => <Svg size={size}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" /></Svg>;
export const Languages = ({ size }: P) => <Svg size={size}><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></Svg>;
export const MapPin = ({ size }: P) => <Svg size={size}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></Svg>;
export const RefreshCw = ({ size }: P) => <Svg size={size}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></Svg>;
export const Search = ({ size }: P) => <Svg size={size}><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></Svg>;
export const ShieldCheck = ({ size }: P) => <Svg size={size}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></Svg>;
