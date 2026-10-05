import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Listings QA',
};

export default function ListingsQaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
