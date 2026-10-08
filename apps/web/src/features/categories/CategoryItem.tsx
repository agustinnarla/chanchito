import type { Category } from '@chanchito/core'
import { Pencil, Trash2 } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeleteCategoryDialog } from './DeleteCategoryDialog'
import { useRenameCategory } from './hooks'

export function CategoryItem({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <li className="flex min-h-12 items-center gap-2 px-4 py-2">
      {editing ? (
        <RenameForm category={category} onDone={() => setEditing(false)} />
      ) : (
        <>
          <span className="flex-1">{category.name}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Renombrar ${category.name}`}
            onClick={() => setEditing(true)}
          >
            <Pencil />
          </Button>
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
