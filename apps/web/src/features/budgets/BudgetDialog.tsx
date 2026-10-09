import { formatMonthLabel, type Budget, type BudgetInput, type Month } from '@chanchito/core'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCategories } from '@/features/categories/hooks'
import { BudgetForm } from './BudgetForm'
import { BudgetError } from './errors'
import { useCreateBudget, useUpdateBudgetAmount } from './hooks'
import { CURRENCY_NAME } from './labels'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: Month
  /** Budget to edit; undefined to create a new one. */
  budget?: Budget
}

export function BudgetDialog({ open, onOpenChange, month, budget }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{budget ? 'Editar presupuesto' : 'Nuevo presupuesto'}</DialogTitle>
          <DialogDescription>Para {formatMonthLabel(month).toLowerCase()}.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open: data is loaded and the form starts fresh each time. */}
        <BudgetDialogBody month={month} budget={budget} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

type BodyProps = { month: Month; budget?: Budget; onDone: () => void }

function BudgetDialogBody({ month, budget, onDone }: BodyProps) {
  const categories = useCategories()
  const create = useCreateBudget()
  const update = useUpdateBudgetAmount()
  const save = budget ? update : create

  function handleSubmit(input: BudgetInput) {
    const onSuccess = () => {
      onDone()
      toast.success('Presupuesto guardado')
    }
    if (budget) {
      update.mutate({ id: budget.id, amount: input.amount }, { onSuccess })
    } else {
      create.mutate(input, { onSuccess })
    }
  }

  /** A duplicate gets a message that names the category, currency and month. */
  function saveError(): string | null {
    const error = save.error
    if (!error) return null
    const input = create.variables
    if (error instanceof BudgetError && error.reason === 'duplicate' && input) {
      const name = categories.data?.find((c) => c.id === input.categoryId)?.name
      if (name) {
        return `Ya hay un presupuesto en ${CURRENCY_NAME[input.amount.currency]} para «${name}» en ${formatMonthLabel(month).toLowerCase()}.`
      }
    }
    return error.message
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
    <BudgetForm
      categories={categories.data}
      month={month}
      budget={budget}
      saving={save.isPending}
      saveError={saveError()}
      onSubmit={handleSubmit}
      onCancel={onDone}
    />
  )
}
