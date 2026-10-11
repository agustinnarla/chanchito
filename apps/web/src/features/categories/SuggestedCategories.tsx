import { SUGGESTED_CATEGORIES, type Category } from '@chanchito/core'
import { Button } from '@/components/ui/button'
import { useCreateSuggestedCategories } from './hooks'

const preview = SUGGESTED_CATEGORIES.map((c) => c.name).join(', ')

export function SuggestedCategories({ existing }: { existing: Category[] }) {
  const create = useCreateSuggestedCategories()

  return (
    <section className="space-y-3 rounded-[28px] bg-surface-low p-6">
      <p className="font-medium">Todavía no tenés categorías.</p>
      <p className="text-sm text-muted-foreground">
        Podés crear las tuyas o arrancar con un set típico que después editás: {preview}.
      </p>
      <Button disabled={create.isPending} onClick={() => create.mutate(existing)}>
        {create.isPending ? 'Creando…' : 'Crear categorías sugeridas'}
      </Button>
      {create.isError && (
        <p role="alert" className="text-sm text-destructive">
          {create.error.message}
        </p>
      )}
    </section>
  )
}
