import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { RecipeInteractive } from './RecipeInteractive';

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { orderBy: { order: 'asc' } },
      steps: { orderBy: { order: 'asc' } },
      tags: true,
    },
  });

  if (!recipe || recipe.status !== 'READY') notFound();

  return <RecipeInteractive recipe={recipe} />;
}
