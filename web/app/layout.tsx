import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Calais Open Commons',
  description: 'Répertoire gratuit de services publics et associatifs à Calais.',
};

const localeBootstrap = `try{var l=localStorage.getItem('cocp-locale');if(l==='fr'||l==='en'||l==='ar'){var d=document.documentElement;d.lang=l;d.dir=['ar','ps','fa','ckb'].indexOf(l)>-1?'rtl':'ltr'}}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Set lang/dir from the saved locale before first paint (no-JS default: fr, ltr). */}
        <script dangerouslySetInnerHTML={{ __html: localeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
