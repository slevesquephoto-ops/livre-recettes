import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-amber-900 mb-4">
          📖 Mon livre de recettes
        </h1>
        <p className="text-amber-700 text-lg mb-8">
          Importez vos recettes vidéo YouTube, TikTok ou Facebook.
        </p>
        <Link
          href="/add"
          className="bg-amber-600 text-white rounded-xl px-8 py-4 font-semibold text-lg hover:bg-amber-700 transition-colors"
        >
          + Ajouter une recette
        </Link>
      </div>
    </main>
  );
}
