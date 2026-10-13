import { formatMoney, type GoalProgress } from '@chanchito/core'
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
import { useDeleteGoal } from './hooks'

type Props = { progress: GoalProgress; open: boolean; onOpenChange: (open: boolean) => void }

export function DeleteGoalDialog({ progress, open, onOpenChange }: Props) {
  const remove = useDeleteGoal()

  function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    // Keep the dialog open until the delete finishes, so an error can be shown.
    event.preventDefault()
    remove.mutate(progress.goal.id, {
      onSuccess: () => {
        onOpenChange(false)
        toast.success('Meta eliminada')
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
          <AlertDialogTitle>¿Eliminar «{progress.goal.name}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borran también sus aportes ({formatMoney(progress.saved)} ahorrados). Si ya la
            cumpliste, podés archivarla en lugar de eliminarla.
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
