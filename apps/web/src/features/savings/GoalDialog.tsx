import {
  DEFAULT_CATEGORY_EMOJI,
  formatAmountForInput,
  parseGoalForm,
  resolveCategoryEmoji,
  type Currency,
  type GoalFormErrors,
  type GoalFormValues,
  type SavingsGoal,
} from '@chanchito/core'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { DialogActions } from '@/components/DialogActions'
import { EmojiPicker } from '@/components/EmojiPicker'
import { FormField } from '@/components/FormField'
import { Segmented } from '@/components/Segmented'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SavingsError } from './errors'
import { useCreateGoal, useUpdateGoal } from './hooks'

const CURRENCIES = [
  { value: 'ARS', label: 'ARS' },
  { value: 'USD', label: 'USD' },
] as const satisfies readonly { value: Currency; label: string }[]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Goal to edit; undefined to create a new one. */
  goal?: SavingsGoal
}

/** Create or edit a savings goal: its name, emoji and target, and the currency it's saved in. */
export function GoalDialog({ open, onOpenChange, goal }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{goal ? 'Editar meta' : 'Nueva meta'}</DialogTitle>
          <DialogDescription>Para juntar plata para algo concreto.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open: the form starts fresh each time. */}
        <GoalForm goal={goal} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function initialValues(goal?: SavingsGoal): GoalFormValues {
  if (!goal) {
    return {
      name: '',
      emoji: DEFAULT_CATEGORY_EMOJI,
      targetAmount: '',
      targetCurrency: 'ARS',
      savingCurrency: 'ARS',
    }
  }
  return {
    name: goal.name,
    emoji: resolveCategoryEmoji(goal.emoji),
    targetAmount: formatAmountForInput(goal.target.amount),
    targetCurrency: goal.target.currency,
    savingCurrency: goal.savingCurrency,
  }
}

function GoalForm({ goal, onDone }: { goal?: SavingsGoal; onDone: () => void }) {
  const id = useId()
  const [values, setValues] = useState(() => initialValues(goal))
  const [errors, setErrors] = useState<GoalFormErrors>({})
  const create = useCreateGoal()
  const update = useUpdateGoal()
  const save = goal ? update : create

  function change<K extends keyof GoalFormValues>(field: K, value: GoalFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    save.reset()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = parseGoalForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    const onSuccess = () => {
      onDone()
      toast.success(goal ? 'Meta guardada' : 'Meta creada')
    }
    if (goal) {
      update.mutate({ id: goal.id, changes: result.data }, { onSuccess })
    } else {
      create.mutate(result.data, { onSuccess })
    }
  }

  const errorId = (field: keyof GoalFormValues) => `${id}-${field}-error`
  const duplicate = save.error instanceof SavingsError && save.error.reason === 'duplicate'
  const nameError = errors.name ?? (duplicate ? save.error?.message : undefined)

  return (
    <form aria-label="Meta" className="space-y-5" noValidate onSubmit={handleSubmit}>
      <FormField label="Nombre" htmlFor={`${id}-name`} error={nameError} errorId={errorId('name')}>
        <Input
          id={`${id}-name`}
          placeholder="Ej: Celular nuevo"
          value={values.name}
          onChange={(event) => change('name', event.target.value)}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? errorId('name') : undefined}
        />
      </FormField>

      <div className="space-y-2">
        <p className="text-sm font-medium" id={`${id}-target`}>
          Objetivo
        </p>
        <div className="flex items-center gap-2">
          <Input
            aria-labelledby={`${id}-target`}
            inputMode="decimal"
            placeholder="0,00"
            className="font-mono"
            value={values.targetAmount}
            onChange={(event) => change('targetAmount', event.target.value)}
            aria-invalid={Boolean(errors.targetAmount)}
            aria-describedby={errors.targetAmount ? errorId('targetAmount') : undefined}
          />
          <Segmented
            label="Moneda del objetivo"
            options={CURRENCIES}
            value={values.targetCurrency}
            onChange={(currency) => change('targetCurrency', currency)}
            size="sm"
            className="shrink-0"
          />
        </div>
        {errors.targetAmount && (
          <p id={errorId('targetAmount')} className="text-sm text-destructive">
            {errors.targetAmount}
          </p>
        )}
      </div>

      {goal ? (
        <p className="text-sm text-muted-foreground">
          Ahorrás en {goal.savingCurrency === 'ARS' ? 'pesos' : 'dólares'}.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium" id={`${id}-saving`}>
            Ahorrás en
          </p>
          <Segmented
            label="Ahorrás en"
            options={[
              { value: 'ARS', label: 'Pesos' },
              { value: 'USD', label: 'Dólares' },
            ]}
            value={values.savingCurrency}
            onChange={(currency) => change('savingCurrency', currency)}
            className="flex w-full"
          />
          {values.targetCurrency !== values.savingCurrency && (
            <p className="text-sm text-muted-foreground">
              El objetivo se convierte con el dólar MEP del día.
            </p>
          )}
        </div>
      )}

      <div className="space-y-2.5">
        <p id={`${id}-emoji`} className="text-sm font-medium text-muted-foreground">
          Emoji
        </p>
        <EmojiPicker
          value={values.emoji}
          onChange={(emoji) => change('emoji', emoji)}
          labelId={`${id}-emoji`}
        />
      </div>

      {save.isError && !duplicate && (
        <p role="alert" className="text-sm text-destructive">
          {save.error.message}
        </p>
      )}

      <DialogActions>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Guardando…' : goal ? 'Guardar' : 'Crear'}
        </Button>
      </DialogActions>
    </form>
  )
}
