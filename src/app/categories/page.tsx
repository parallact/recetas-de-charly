import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'

async function getCategories() {
  try {
    // Fetch categories and recipe counts in parallel
    const [categories, recipeCategoriesData] = await Promise.all([
      prisma.categories.findMany({
        select: { id: true, name: true, slug: true, icon: true, description: true },
        orderBy: { name: 'asc' }
      }),
      prisma.recipe_categories.findMany({
        select: { category_id: true }
      })
    ])

    // Count recipes per category in memory
    const countsByCategory: Record<string, number> = {}
    for (const rc of recipeCategoriesData) {
      countsByCategory[rc.category_id] = (countsByCategory[rc.category_id] || 0) + 1
    }

    return categories.map((cat) => ({
      ...cat,
      recipeCount: countsByCategory[cat.id] || 0,
    }))
  } catch {
    return []
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Categorias</h1>
        <p className="text-muted-foreground">
          Explora recetas por categoria
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/recipes?category=${category.slug}`}>
              <Card className="group hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 text-center">
                  <span className="text-4xl mb-3 block">{category.icon || '🍽️'}</span>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {category.recipeCount} {category.recipeCount === 1 ? 'receta' : 'recetas'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📂</p>
          <h3 className="text-xl font-semibold mb-2">No hay categorias</h3>
          <p className="text-muted-foreground mb-6">
            Las categorias apareceran aqui pronto
          </p>
          <Button asChild>
            <Link href="/recipes">Ver todas las recetas</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
