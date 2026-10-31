import {
  formatAmountForInput,
  parseMovementForm,
  sortCategories,
  todayIso,
  type Category,
  type CategoryKind,
  type Currency,
  type Movement,
  type MovementFormErrors,
  type MovementFormValues,
  type MovementInput,
} from '@chanchito/core'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '@/components/AppText'
import { Button } from '@/components/Button'
import { CategoryPicker } from '@/components/CategoryPicker'
import { DateField } from '@/components/DateField'
import { Icon } from '@/components/Icon'
import { Segmented } from '@/components/Segmented'
import { TextField } from '@/components/TextField'
import { useTheme } from '@/theme/use-theme'

const KIND_OPTIONS = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' },
] as const satisfies readonly { value: CategoryKind; label: string }[]

const CURRENCY_OPTIONS = [
  { value: 'ARS', label: 'ARS' },
  { value: 'USD', label: 'USD' },
] as const satisfies readonly { value: Currency; label: string }[]

export function initialValues(movement?: Movement): MovementFormValues {
  if (!movement) {
    return { amount: '', currency: 'ARS', occurredOn: todayIso(), categoryId: '', description: '' }
  }
  return {
    amount: formatAmountForInput(movement.amount.amount),
    currency: movement.amount.currency,
    occurredOn: movement.occurredOn,
    categoryId: movement.category.id,
    description: movement.description ?? '',
  }
}

type Props = {
  categories: Category[]
  /** Movement being edited; undefined for a new one. */
  movement?: Movement
  values: MovementFormValues
  onValuesChange: (values: MovementFormValues) => void
  saving: boolean
  saveError: string | null
  onSubmit: (input: MovementInput) => void
  /** Only when editing. */
  onDelete?: () => void
  deleting?: boolean
}

/** The movement's fields, with the same defaults and rules as the web (spec 003). */
export function MovementForm({
  categories,
  movement,
  values,
  onValuesChange,
  saving,
  saveError,
  onSubmit,
  onDelete,
  deleting = false,
}: Props) {
  const { colors } = useTheme()
  const [kind, setKind] = useState<CategoryKind>(movement?.category.kind ?? 'expense')
  const [errors, setErrors] = useState<MovementFormErrors>({})

  // Active categories of the chosen kind, plus the movement's own category if it was archived.
  const options = sortCategories(
    categories.filter((c) => c.kind === kind && (!c.archived || c.id === movement?.category.id)),
  )

  function update<K extends keyof MovementFormValues>(field: K, value: MovementFormValues[K]) {
    onValuesChange({ ...values, [field]: value })
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function changeKind(next: CategoryKind) {
    setKind(next)
    const current = categories.find((c) => c.id === values.categoryId)
    if (current && current.kind !== next) update('categoryId', '')
  }

  function submit() {
    const result = parseMovementForm(values)
    if (result.ok) {
      onSubmit(result.data)
    } else {
      setErrors(result.errors)
    }
  }

  return (
    <View style={styles.form}>
      <Segmented label="Tipo" options={KIND_OPTIONS} value={kind} onChange={changeKind} />

      <View style={styles.amountRow}>
        <View style={styles.fill}>
          <TextField
            label="Monto"
            placeholder="0,00"
            keyboardType="decimal-pad"
            value={values.amount}
            onChangeText={(amount) => update('amount', amount)}
            error={errors.amount}
          />
        </View>
        <View style={styles.currency}>
          <Segmented
            label="Moneda"
            options={CURRENCY_OPTIONS}
            value={values.currency}
            onChange={(currency) => update('currency', currency)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <AppText size="caption" weight="medium" muted>
          Categoría
        </AppText>
        {options.length === 0 ? (
          <AppText style={[styles.empty, { backgroundColor: colors.surface }]}>
            No tenés categorías de {kind === 'expense' ? 'gasto' : 'ingreso'}. Crealas desde la web,
            en Categorías.
          </AppText>
        ) : (
          <CategoryPicker
            categories={options}
            value={values.categoryId}
            onChange={(categoryId) => update('categoryId', categoryId)}
            error={errors.categoryId}
          />
        )}
      </View>

      <DateField
        label="Fecha"
        value={values.occurredOn}
        onChange={(date) => update('occurredOn', date)}
        error={errors.occurredOn}
      />

      <TextField
        label="Descripción (opcional)"
        placeholder="Ej: Compra del mes"
        value={values.description}
        onChangeText={(description) => update('description', description)}
        error={errors.description}
      />

      {saveError && (
        <View
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          style={[styles.alert, { backgroundColor: colors.badChip }]}
        >
          <Icon name="error" filled color={colors.badOnChip} size={20} />
          <AppText weight="semibold" color={colors.badOnChip} style={styles.fill}>
            {saveError}
          </AppText>
        </View>
      )}

      <Button
        label={saving ? 'Guardando…' : 'Guardar'}
        icon="check"
        loading={saving}
        disabled={deleting}
        onPress={submit}
      />
      {onDelete && (
        <Button
          label={deleting ? 'Eliminando…' : 'Eliminar'}
          icon="delete"
          variant="destructive"
          loading={deleting}
          disabled={saving}
          onPress={onDelete}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: 20 },
  fill: { flex: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  currency: { paddingBottom: 6 },
  section: { gap: 8 },
  empty: { borderRadius: 18, padding: 16 },
  alert: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
})
