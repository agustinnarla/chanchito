import { CATEGORY_KIND_LABELS, type Category } from '@chanchito/core'
import { ArchiveRestore, Pencil, Trash2 } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeleteCategoryDialog } from './DeleteCategoryDialog'
import { useRenameCategory, useRestoreCategory } from './hooks'

type Props = { category: Category; showKind?: boolean }

export function CategoryItem({ category, showKind = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const restore = useRestoreCategory()

  function handleRestore() {
    restore.mutate(category, {
      onSuccess: () => toast.success(`Se restauró «${category.name}».`),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <li className="flex min-h-12 items-center gap-2 px-4 py-2">
      {editing ? (
        <RenameForm category={category} onDone={() => setEditing(false)} />
      ) : (
        <>
          <span className="flex-1">
            {category.name}
            {showKind && (
              <span className="ml-2 text-sm text-muted-foreground">
                ({CATEGORY_KIND_LABELS[category.kind]})
              </span>
            )}
          </span>
          {category.archived ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Restaurar ${category.name}`}
              disabled={restore.isPending}
              onClick={handleRestore}
            >
              <ArchiveRestore />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Renombrar ${category.name}`}
              onClick={() => setEditing(true)}
            >
              <Pencil />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Eliminar ${category.name}`}
            onClick={() => setDeleting(true)}
          >
            <Trash2 />
          </Button>
        </>
      )}
      <DeleteCategoryDialog category={category} open={deleting} onOpenChange={setDeleting} />
    </li>
  )
}

function RenameForm({ category, onDone }: { category: Category; onDone: () => void }) {
  const [name, setName] = useState(category.name)
  const rename = useRenameCategory()
  const errorId = `rename-error-${category.id}`

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name === category.name) {
      onDone()
      return
    }
    rename.mutate({ category, name }, { onSuccess: onDone })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') onDone()
  }

  return (
    <form
      aria-label={`Renombrar ${category.name}`}
      className="flex flex-1 flex-wrap items-center gap-2"
      onSubmit={handleSubmit}
    >
      <Input
        aria-label="Nuevo nombre"
        className="min-w-40 flex-1"
        value={name}
        autoFocus
        onChange={(event) => {
          setName(event.target.value)
          rename.reset()
        }}
        onKeyDown={handleKeyDown}
        aria-invalid={rename.isError}
        aria-describedby={rename.isError ? errorId : undefined}
      />
      <Button type="submit" size="sm" disabled={rename.isPending}>
        Guardar
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onDone}>
        Cancelar
      </Button>
      {rename.isError && (
        <p id={errorId} role="alert" className="basis-full text-sm text-destructive">
          {rename.error.message}
        </p>
      )}
    </form>
  )
}
