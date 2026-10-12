import { CATEGORY_KIND_LABELS, type Category } from '@chanchito/core'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { CategoryEmoji } from '@/components/CategoryEmoji'
import { Icon } from '@/components/Icon'
import { Panel } from '@/components/Panel'
import { StaggerList } from '@/components/StaggerList'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CategoryDialog } from './CategoryDialog'
import { DeleteCategoryDialog } from './DeleteCategoryDialog'
import { useCategories, useRestoreCategory } from './hooks'
import { SuggestedCategories } from './SuggestedCategories'

export function CategoriesPage() {
  const { data: categories, isPending, isError, refetch } = useCategories()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const active = categories?.filter((c) => !c.archived) ?? []
  const archived = categories?.filter((c) => c.archived) ?? []

  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Categorías</h1>
        <Button variant="secondary" onClick={() => setCreating(true)}>
          <Icon name="add" className="size-5" />
          Nueva categoría
        </Button>
      </Panel>

      {isPending ? (
        <Panel>
          <p className="text-muted-foreground">Cargando categorías…</p>
        </Panel>
      ) : isError ? (
        <Panel role="alert" className="space-y-2">
          <p className="text-destructive">No se pudieron cargar las categorías.</p>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </Panel>
      ) : (
        <>
          {categories.length === 0 && <SuggestedCategories existing={categories} />}
          <TileSection
            title="Gastos"
            emptyMessage="Todavía no tenés categorías de gasto."
            categories={active.filter((c) => c.kind === 'expense')}
            onPick={setEditing}
          />
          <TileSection
            title="Ingresos"
            emptyMessage="Todavía no tenés categorías de ingreso."
            categories={active.filter((c) => c.kind === 'income')}
            onPick={setEditing}
          />
          {archived.length > 0 && <ArchivedSection categories={archived} onDelete={setDeleting} />}
        </>
      )}

      <CategoryDialog open={creating} onOpenChange={setCreating} />
      <CategoryDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        category={editing ?? undefined}
        onDelete={() => {
          setDeleting(editing)
          setEditing(null)
        }}
      />
      {deleting && (
        <DeleteCategoryDialog
          category={deleting}
          open
          onOpenChange={(open) => !open && setDeleting(null)}
        />
      )}
    </div>
  )
}

type TileSectionProps = {
  title: string
  emptyMessage: string
  categories: Category[]
  onPick: (category: Category) => void
}

function TileSection({ title, emptyMessage, categories, onPick }: TileSectionProps) {
  const headingId = useId()
  return (
    <Panel aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-4 text-lg font-semibold">
        {title}
      </h2>
      {categories.length === 0 ? (
        <p className="text-muted-foreground">{emptyMessage}</p>
      ) : (
        <StaggerList className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))]">
          {categories.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => onPick(category)}
                aria-label={`Editar ${category.name}`}
                className="flex w-full flex-col items-center gap-2.5 rounded-[20px] bg-surface px-3 py-4 transition-colors hover:bg-surface-high"
              >
                <CategoryEmoji emoji={category.emoji} className="size-10" />
                <span className="line-clamp-2 text-center text-sm leading-tight font-medium break-words">
                  {category.name}
                </span>
              </button>
            </li>
          ))}
        </StaggerList>
      )}
    </Panel>
  )
}

function ArchivedSection({
  categories,
  onDelete,
}: {
  categories: Category[]
  onDelete: (category: Category) => void
}) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  return (
    <Panel aria-label="Archivadas" className="px-3 py-2 sm:px-3 sm:py-2">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen(!open)}
          className="flex h-13 w-full items-center justify-between rounded-2xl px-3 text-[15px] font-medium text-muted-foreground hover:bg-surface"
        >
          Archivadas ({categories.length})
          <Icon
            name="keyboard_arrow_down"
            className={cn('transition-transform', open && 'rotate-180')}
          />
        </button>
      </h2>
      {open && (
        <div id={listId} className="px-3 pb-3">
          <p className="mb-2 text-sm text-muted-foreground">
            Tienen movimientos, así que no se ofrecen al cargar nuevos. Podés restaurarlas.
          </p>
          <ul>
            {categories.map((category) => (
              <ArchivedItem key={category.id} category={category} onDelete={onDelete} />
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

function ArchivedItem({
  category,
  onDelete,
}: {
  category: Category
  onDelete: (category: Category) => void
}) {
  const restore = useRestoreCategory()

  function handleRestore() {
    restore.mutate(category, {
      onSuccess: () => toast.success(`Se restauró «${category.name}».`),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <li className="flex items-center gap-3 py-2">
      <CategoryEmoji emoji={category.emoji} />
      <span className="flex-1">
        {category.name}
        <span className="ml-2 text-sm text-muted-foreground">
          ({CATEGORY_KIND_LABELS[category.kind]})
        </span>
      </span>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Restaurar ${category.name}`}
        disabled={restore.isPending}
        onClick={handleRestore}
      >
        <Icon name="unarchive" className="size-5" />
        Restaurar
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Eliminar ${category.name}`}
        className="text-muted-foreground"
        onClick={() => onDelete(category)}
      >
        <Icon name="delete" className="size-5" />
      </Button>
    </li>
  )
}
