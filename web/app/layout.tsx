import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Calais Open Commons',
  description: 'Répertoire gratuit de services publics et associatifs à Calais.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
