import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import { ThemeProvider } from 'next-themes';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'Mon livre de recettes',
  description: 'Importez vos recettes vidéo YouTube, TikTok ou Facebook.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased flex flex-col transition-colors">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="print:hidden sticky top-0 z-10 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-6 py-4 flex items-center justify-between shadow-sm dark:shadow-none">
            <Link href="/" className="font-bold text-stone-900 dark:text-stone-100 text-xl tracking-tight hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
              📖 Mon livre de recettes
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/add"
                className="bg-orange-600 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-orange-700 transition-colors"
              >
                + Importer
              </Link>
            </div>
          </header>
          <div className="flex-1">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
