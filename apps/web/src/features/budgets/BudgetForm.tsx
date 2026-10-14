import {
  formatAmountForInput,
  parseBudgetForm,
  sortCategories,
  type Budget,
  type BudgetFormErrors,
  type BudgetFormValues,
  type BudgetInput,
  type Category,
  type Currency,
  type Month,
} from '@chanchito/core'
import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { CategoryEmoji } from '@/components/CategoryEmoji'
import { CategoryPicker } from '@/components/CategoryPicker'
import { DialogActions } from '@/components/DialogActions'
import { FormField } from '@/components/FormField'
import { Segmented } from '@/components/Segmented'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CURRENCY_NAME } from './labels'

type Props = {
  categories: Category[]
  month: Month
  /** Budget being edited, monthly or weekly (only its amount can change); undefined for a new one. */
  budget?: Pick<Budget, 'category' | 'amount'>
  saving: boolean
  saveError: string | null
  onSubmit: (input: BudgetInput) => void
  onCancel: () => void
}

const CURRENCY_OPTIONS = [
  { value: 'ARS', label: 'ARS' },
  { value: 'USD', label: 'USD' },
] as const satisfies readonly { value: Currency; label: string }[]

function initialValues(budget?: Pick<Budget, 'category' | 'amount'>): BudgetFormValues {
  if (!budget) return { categoryId: '', currency: 'ARS', amount: '' }
  return {
    categoryId: budget.category.id,
    currency: budget.amount.currency,
    amount: formatAmountForInput(budget.amount.amount),
  }
}

export function BudgetForm({
  categories,
  month,
  budget,
  saving,
  saveError,
  onSubmit,
  onCancel,
}: Props) {
  const id = useId()
  const [values, setValues] = useState(() => initialValues(budget))
  const [errors, setErrors] = useState<BudgetFormErrors>({})
  const options = sortCategories(categories.filter((c) => c.kind === 'expense' && !c.archived))

  function update<K extends keyof BudgetFormValues>(field: K, value: BudgetFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = parseBudgetForm(values, month)
    if (result.ok) {
      onSubmit(result.data)
    } else {
      setErrors(result.errors)
    }
  }

  const fieldId = (field: string) => `${id}-${field}`
  const errorId = (field: keyof BudgetFormValues) => `${id}-${field}-error`
  const describedBy = (field: keyof BudgetFormValues) =>
    errors[field] ? errorId(field) : undefined

  const cannotCreate = !budget && options.length === 0

  return (
    <form aria-label="Presupuesto" className="space-y-5" noValidate onSubmit={handleSubmit}>
      {budget ? (
        <div className="flex items-center gap-3 rounded-[18px] bg-surface p-3">
          <CategoryEmoji emoji={budget.category.emoji} className="size-8" />
          <p className="font-medium">
            {budget.category.name}
            {budget.category.archived && ' (archivada)'} · en{' '}
            {CURRENCY_NAME[budget.amount.currency]}
          </p>
        </div>
      ) : cannotCreate ? (
        <p className="rounded-[18px] bg-surface p-4 text-sm">
          No tenés categorías de gasto.{' '}
          <Link to="/categorias" className="font-semibold underline" onClick={onCancel}>
            Crealas en Categorías
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="space-y-2.5">
            <p id={fieldId('category-label')} className="text-sm font-medium text-muted-foreground">
              Categoría
            </p>
            <CategoryPicker
              categories={options}
              value={values.categoryId}
              onChange={(categoryId) => update('categoryId', categoryId)}
              labelId={fieldId('category-label')}
              error={errors.categoryId}
              errorId={errorId('categoryId')}
            />
          </div>
          <Segmented
            label="Moneda"
            options={CURRENCY_OPTIONS}
            value={values.currency}
            onChange={(currency) => update('currency', currency)}
          />
        </>
      )}

      <FormField
        label="Monto"
        htmlFor={fieldId('amount')}
        error={errors.amount}
        errorId={errorId('amount')}
      >
        <Input
          id={fieldId('amount')}
          inputMode="decimal"
          autoComplete="off"
          placeholder="60.000"
          value={values.amount}
          onChange={(event) => update('amount', event.target.value)}
          aria-invalid={Boolean(errors.amount)}
          aria-describedby={describedBy('amount')}
        />
      </FormField>

      {saveError && (
        <p role="alert" className="text-sm text-destructive">
          {saveError}
        </p>
      )}

      <DialogActions>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || cannotCreate}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </form>
  )
}
