import {
  currentMonth,
  formatMonthLabel,
  type Budget,
  type BudgetInput,
  type Month,
  type WeeklyBudget,
} from '@chanchito/core'
import { useState } from 'react'
import { toast } from 'sonner'
import { Segmented } from '@/components/Segmented'
import { Loading, Skeleton } from '@/components/Skeleton'
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
import {
  useCreateBudget,
  useCreateWeeklyBudget,
  useUpdateBudgetAmount,
  useUpdateWeeklyBudgetAmount,
} from './hooks'
import { CURRENCY_NAME } from './labels'

type Period = 'month' | 'week'

const PERIODS = [
  { value: 'month', label: 'Por mes' },
  { value: 'week', label: 'Por semana' },
] as const satisfies readonly { value: Period; label: string }[]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The month a monthly budget is for; the current one by default. */
  month?: Month
  /** Budget to edit; undefined to create a new one. */
  budget?: Budget | WeeklyBudget
  /** Monthly or weekly (spec 013). When creating, it can be switched in the dialog. */
  period?: Period
}

export function BudgetDialog({ open, onOpenChange, month, budget, period = 'month' }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Mounted only while open: data is loaded and the form starts fresh each time. */}
        <BudgetDialogBody
          month={month ?? currentMonth()}
          budget={budget}
          initialPeriod={period}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

type BodyProps = {
  month: Month
  budget?: Budget | WeeklyBudget
  initialPeriod: Period
  onDone: () => void
}

function BudgetDialogBody({ month, budget, initialPeriod, onDone }: BodyProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const categories = useCategories()
  const create = useCreateBudget()
  const update = useUpdateBudgetAmount()
  const createWeekly = useCreateWeeklyBudget()
  const updateWeekly = useUpdateWeeklyBudgetAmount()
  const weekly = period === 'week'
  const save = weekly ? (budget ? updateWeekly : createWeekly) : budget ? update : create

  function handleSubmit(input: BudgetInput) {
    const onSuccess = () => {
      onDone()
      toast.success('Presupuesto guardado')
    }
    if (budget) {
      const mutation = weekly ? updateWeekly : update
      mutation.mutate({ id: budget.id, amount: input.amount }, { onSuccess })
    } else if (weekly) {
      createWeekly.mutate({ categoryId: input.categoryId, amount: input.amount }, { onSuccess })
    } else {
      create.mutate(input, { onSuccess })
    }
  }

  /** A duplicate gets a message that names the category, currency and month or week. */
  function saveError(): string | null {
    const error = save.error
    if (!error) return null
    const input = weekly ? createWeekly.variables : create.variables
    if (error instanceof BudgetError && error.reason === 'duplicate' && input) {
      const name = categories.data?.find((c) => c.id === input.categoryId)?.name
      const currency = CURRENCY_NAME[input.amount.currency]
      if (name) {
        return weekly
          ? `Ya hay un presupuesto semanal en ${currency} para «${name}».`
          : `Ya hay un presupuesto en ${currency} para «${name}» en ${formatMonthLabel(month).toLowerCase()}.`
      }
    }
    return error.message
  }

  const header = (
    <DialogHeader>
      <DialogTitle>
        {budget
          ? weekly
            ? 'Editar presupuesto semanal'
            : 'Editar presupuesto'
          : 'Nuevo presupuesto'}
      </DialogTitle>
      <DialogDescription>
        {weekly
          ? 'Se repite todas las semanas, de lunes a domingo.'
          : `Para ${formatMonthLabel(month).toLowerCase()}.`}
      </DialogDescription>
    </DialogHeader>
  )

  if (categories.isPending) {
    return (
      <>
        {header}
        <Loading label="Cargando categorías…" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-21 rounded-[18px]" />
          ))}
        </Loading>
      </>
    )
  }
  if (categories.isError) {
    return (
      <>
        {header}
        <p role="alert" className="text-destructive">
          No se pudieron cargar las categorías.
        </p>
      </>
    )
  }
  return (
    <>
      {header}
      {!budget && (
        <Segmented
          label="Período"
          options={PERIODS}
          value={period}
          onChange={(next) => {
            setPeriod(next)
            create.reset()
            createWeekly.reset()
          }}
          className="flex w-full"
        />
      )}
      <BudgetForm
        categories={categories.data}
        month={month}
        budget={budget}
        saving={save.isPending}
        saveError={saveError()}
        onSubmit={handleSubmit}
        onCancel={onDone}
      />
    </>
  )
}
