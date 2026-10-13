import {
  DEFAULT_CATEGORY_EMOJI,
  resolveCategoryEmoji,
  type Category,
  type CategoryEmoji,
  type CategoryKind,
} from '@chanchito/core'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { DialogActions } from '@/components/DialogActions'
import { EmojiPicker } from '@/components/EmojiPicker'
import { Icon } from '@/components/Icon'
import { Segmented } from '@/components/Segmented'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateCategory, useUpdateCategory } from './hooks'

const KIND_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
] as const satisfies readonly { value: CategoryKind; label: string }[]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Category to edit; undefined to create one. */
  category?: Category
  /** Asks to delete the category being edited. */
  onDelete?: () => void
}

export function CategoryDialog({ open, onOpenChange, category, onDelete }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          <DialogDescription>
            {category
              ? `Categoría de ${category.kind === 'expense' ? 'gasto' : 'ingreso'}.`
              : 'Para ordenar tus ingresos y gastos.'}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open: the form starts fresh each time. */}
        <CategoryForm category={category} onDone={() => onOpenChange(false)} onDelete={onDelete} />
      </DialogContent>
    </Dialog>
  )
}

type FormProps = { category?: Category; onDone: () => void; onDelete?: () => void }

function CategoryForm({ category, onDone, onDelete }: FormProps) {
  const id = useId()
  const [name, setName] = useState(category?.name ?? '')
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? 'expense')
  const [emoji, setEmoji] = useState<CategoryEmoji>(
    category ? resolveCategoryEmoji(category.emoji) : DEFAULT_CATEGORY_EMOJI,
  )
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const save = category ? update : create

  function finish(message: string) {
    onDone()
    toast.success(message)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (category) {
      if (name === category.name && emoji === category.emoji) {
        onDone()
        return
      }
      update.mutate(
        { category, changes: { name, emoji } },
        { onSuccess: () => finish('Categoría guardada') },
      )
    } else {
      create.mutate({ name, kind, emoji }, { onSuccess: () => finish('Categoría creada') })
    }
  }

  return (
    <form aria-label="Categoría" className="space-y-5" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor={`${id}-name`}>Nombre</Label>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            save.reset()
          }}
          aria-invalid={save.isError}
          aria-describedby={save.isError ? `${id}-error` : undefined}
        />
      </div>

      {!category && (
        <Segmented
          label="Tipo"
          options={KIND_OPTIONS}
          value={kind}
          onChange={(value) => {
            setKind(value)
            save.reset()
          }}
          className="flex w-full"
        />
      )}

      <div className="space-y-2.5">
        <p id={`${id}-emoji`} className="text-sm font-medium text-muted-foreground">
          Emoji
        </p>
        <EmojiPicker
          value={emoji}
          onChange={(key) => setEmoji(resolveCategoryEmoji(key))}
          labelId={`${id}-emoji`}
        />
      </div>

      {save.isError && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {save.error.message}
        </p>
      )}

      <DialogActions>
        {category && onDelete && (
          <Button type="button" variant="destructive" className="mr-auto" onClick={onDelete}>
            <Icon name="delete" className="size-5" />
            Eliminar
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Guardando…' : category ? 'Guardar' : 'Crear'}
        </Button>
      </DialogActions>
    </form>
  )
}
