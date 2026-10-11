import type { Movement, MovementInput } from '@chanchito/core'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCategories } from '@/features/categories/hooks'
import { useCreateMovement, useUpdateMovement } from './hooks'
import { MovementForm } from './MovementForm'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Movement to edit; undefined to create a new one. */
  movement?: Movement
}

export function MovementDialog({ open, onOpenChange, movement }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{movement ? 'Editar movimiento' : 'Nuevo movimiento'}</DialogTitle>
          <DialogDescription>Ingresos y gastos, en pesos o en dólares.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open: data is loaded and the form starts fresh each time. */}
        <MovementDialogBody movement={movement} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function MovementDialogBody({ movement, onDone }: { movement?: Movement; onDone: () => void }) {
  const categories = useCategories()
  const create = useCreateMovement()
  const update = useUpdateMovement()
  const save = movement ? update : create

  function handleSubmit(input: MovementInput) {
    const onSuccess = () => {
      onDone()
      toast.success('Movimiento guardado')
    }
    if (movement) {
      update.mutate({ id: movement.id, input }, { onSuccess })
    } else {
      create.mutate(input, { onSuccess })
    }
  }

  if (categories.isPending) {
    return <p className="text-muted-foreground">Cargando categorías…</p>
  }
  if (categories.isError) {
    return (
      <p role="alert" className="text-destructive">
        No se pudieron cargar las categorías.
      </p>
    )
  }
  return (
    <MovementForm
      categories={categories.data}
      movement={movement}
      saving={save.isPending}
      saveError={save.error?.message ?? null}
      onSubmit={handleSubmit}
      onCancel={onDone}
    />
  )
}
