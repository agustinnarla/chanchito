import { formatDate, formatMovementAmount, type Movement } from '@chanchito/core'
import type { MouseEvent } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteMovement } from './hooks'

type Props = {
  movement: Movement
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteMovementDialog({ movement, open, onOpenChange }: Props) {
  const remove = useDeleteMovement()

  function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    // Keep the dialog open until the delete finishes, so an error can be shown.
    event.preventDefault()
    remove.mutate(movement.id, {
      onSuccess: () => {
        onOpenChange(false)
        toast.success('Movimiento eliminado')
      },
    })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) remove.reset()
        onOpenChange(next)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar este movimiento?</AlertDialogTitle>
          <AlertDialogDescription>
            {movement.category.name} · {formatDate(movement.occurredOn)} ·{' '}
            {formatMovementAmount(movement)}. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError && (
          <p role="alert" className="text-sm text-destructive">
            {remove.error.message}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={handleConfirm}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
