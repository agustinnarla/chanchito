import { Button } from '@/components/ui/button'
import { CategoryForm } from './CategoryForm'
import { CategorySection } from './CategorySection'
import { useCategories } from './hooks'

export function CategoriesPage() {
  const { data: categories, isPending, isError, refetch } = useCategories()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Categorías</h1>
      <CategoryForm />
      {isPending ? (
        <p className="text-muted-foreground">Cargando categorías…</p>
      ) : isError ? (
        <div role="alert" className="space-y-2">
          <p className="text-destructive">No se pudieron cargar las categorías.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <CategorySection
            title="Gastos"
            emptyMessage="Todavía no tenés categorías de gasto."
            categories={categories.filter((c) => c.kind === 'expense')}
          />
          <CategorySection
            title="Ingresos"
            emptyMessage="Todavía no tenés categorías de ingreso."
            categories={categories.filter((c) => c.kind === 'income')}
          />
        </div>
      )}
    </div>
  )
}
