import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CookMode } from './CookMode';

export default async function CookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { steps: { orderBy: { order: 'asc' } } },
  });

  if (!recipe || recipe.status !== 'READY' || recipe.steps.length === 0) notFound();

  return <CookMode recipeId={id} title={recipe.title} steps={recipe.steps} />;
}
