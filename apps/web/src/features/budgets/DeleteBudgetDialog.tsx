import { formatMoney, formatMonthLabel, type Budget, type WeeklyBudget } from '@chanchito/core'
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
import { useDeleteBudget, useDeleteWeeklyBudget } from './hooks'

type Props = {
  budget: Budget | WeeklyBudget
  /** Weekly budgets (spec 013) are deleted for every week. */
  period?: 'month' | 'week'
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteBudgetDialog({ budget, period = 'month', open, onOpenChange }: Props) {
  const removeMonthly = useDeleteBudget()
  const removeWeekly = useDeleteWeeklyBudget()
  const remove = period === 'week' ? removeWeekly : removeMonthly

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

  const when =
    'month' in budget ? formatMonthLabel(budget.month).toLowerCase() : 'todas las semanas'

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
          <AlertDialogTitle>
            {period === 'week'
              ? '¿Eliminar este presupuesto semanal?'
              : '¿Eliminar este presupuesto?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {budget.category.name} · {formatMoney(budget.amount)} · {when}. Los movimientos no se
            borran.
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
