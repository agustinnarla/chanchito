import { addMonths, budgetsToCopy, formatMonthLabel, type Month } from '@chanchito/core'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useBudgets, useCopyBudgets } from './hooks'

type Props = { month: Month; onCreate: () => void }

/** A month without budgets: offers copying last month's, or creating the first one. */
export function EmptyMonth({ month, onCreate }: Props) {
  const previousMonth = addMonths(month, -1)
  const previous = useBudgets(previousMonth)
  const copy = useCopyBudgets()
  const toCopy = budgetsToCopy(previous.data ?? [], month)
  const previousLabel = formatMonthLabel(previousMonth).toLowerCase()

  function handleCopy() {
    copy.mutate(toCopy, {
      onSuccess: (count) =>
        toast.success(
          count === 1 ? 'Se copió 1 presupuesto.' : `Se copiaron ${count} presupuestos.`,
        ),
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground">
        No hay presupuestos para {formatMonthLabel(month).toLowerCase()}.
      </p>
      {previous.isPending ? null : toCopy.length > 0 ? (
        <Button size="sm" disabled={copy.isPending} onClick={handleCopy}>
          {copy.isPending ? 'Copiando…' : `Copiar los de ${previousLabel}`}
        </Button>
      ) : (
        <Button size="sm" onClick={onCreate}>
          Crear el primero
        </Button>
      )}
      {copy.isError && (
        <p role="alert" className="text-sm text-destructive">
          {copy.error.message}
        </p>
      )}
    </div>
  )
}
