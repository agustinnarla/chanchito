import { formatMoney, formatMonthLabel, type Budget } from '@chanchito/core'
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
import { useDeleteBudget } from './hooks'

type Props = {
  budget: Budget
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteBudgetDialog({ budget, open, onOpenChange }: Props) {
  const remove = useDeleteBudget()

  function handleConfirm(event: MouseEvent<HTMLButtonElement>) {
    // Keep the dialog open until the delete finishes, so an error can be shown.
    event.preventDefault()
    remove.mutate(budget.id, {
      onSuccess: () => {
        onOpenChange(false)
        toast.success('Presupuesto eliminado')
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
          <AlertDialogTitle>¿Eliminar este presupuesto?</AlertDialogTitle>
          <AlertDialogDescription>
            {budget.category.name} · {formatMoney(budget.amount)} ·{' '}
            {formatMonthLabel(budget.month).toLowerCase()}. Los movimientos no se borran.
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
