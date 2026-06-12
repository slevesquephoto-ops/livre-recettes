import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'Mon livre de recettes',
  description: 'Importez vos recettes vidéo YouTube, TikTok ou Facebook.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-stone-50 text-stone-900 antialiased flex flex-col">
        <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <Link href="/" className="font-bold text-stone-900 text-xl tracking-tight hover:text-orange-600 transition-colors">
            📖 Mon livre de recettes
          </Link>
          <Link
            href="/add"
            className="bg-orange-600 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-orange-700 transition-colors"
          >
            + Importer
          </Link>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
