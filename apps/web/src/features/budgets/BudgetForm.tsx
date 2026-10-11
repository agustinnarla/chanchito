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
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CURRENCY_NAME } from './labels'

type Props = {
  categories: Category[]
  month: Month
  /** Budget being edited (only its amount can change); undefined for a new one. */
  budget?: Budget
  saving: boolean
  saveError: string | null
  onSubmit: (input: BudgetInput) => void
  onCancel: () => void
}

const CURRENCY_OPTIONS: Currency[] = ['ARS', 'USD']

function initialValues(budget?: Budget): BudgetFormValues {
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
    <form aria-label="Presupuesto" className="space-y-4" noValidate onSubmit={handleSubmit}>
      {budget ? (
        <p>
          {budget.category.name}
          {budget.category.archived && ' (archivada)'} · en {CURRENCY_NAME[budget.amount.currency]}
        </p>
      ) : cannotCreate ? (
        <p className="rounded-md border border-dashed p-3 text-sm">
          No tenés categorías de gasto.{' '}
          <Link to="/categorias" className="underline" onClick={onCancel}>
            Crealas en Categorías
          </Link>
          .
        </p>
      ) : (
        <>
          <FormField
            label="Categoría"
            htmlFor={fieldId('category')}
            error={errors.categoryId}
            errorId={errorId('categoryId')}
          >
            <select
              id={fieldId('category')}
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs aria-invalid:border-destructive"
              value={values.categoryId}
              onChange={(event) => update('categoryId', event.target.value)}
              aria-invalid={Boolean(errors.categoryId)}
              aria-describedby={describedBy('categoryId')}
            >
              <option value="">Elegí una categoría</option>
              {options.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Moneda</legend>
            <RadioGroup
              className="flex gap-4"
              value={values.currency}
              onValueChange={(value) => update('currency', value as Currency)}
            >
              {CURRENCY_OPTIONS.map((option) => (
                <div key={option} className="flex items-center gap-2">
                  <RadioGroupItem id={fieldId(`currency-${option}`)} value={option} />
                  <Label htmlFor={fieldId(`currency-${option}`)}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || cannotCreate}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
