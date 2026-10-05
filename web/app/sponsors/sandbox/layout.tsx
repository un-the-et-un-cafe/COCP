import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Sponsor sandbox — Model B rehearsal',
};

export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
