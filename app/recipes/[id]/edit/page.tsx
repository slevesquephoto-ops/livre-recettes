import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EditForm } from './EditForm';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { orderBy: { order: 'asc' } },
      steps: { orderBy: { order: 'asc' } },
    },
  });

  if (!recipe || recipe.status !== 'READY') notFound();

  return <EditForm recipe={recipe} />;
}
