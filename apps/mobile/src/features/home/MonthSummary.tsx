import {
  CURRENCIES,
  formatMoney,
  formatSignedMoney,
  summarizeMonth,
  type Currency,
  type Movement,
} from '@chanchito/core'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { AppText } from '@/components/AppText'
import { Segmented } from '@/components/Segmented'
import { useTheme } from '@/theme/use-theme'

const CURRENCY_OPTIONS = [
  { value: 'ARS', label: 'Pesos' },
  { value: 'USD', label: 'Dólares' },
] as const

/**
 * The month's result, income and expenses in one currency at a time (pesos and dollars are never
 * added). The currency choice only appears when the month has both.
 */
export function MonthSummary({ movements }: { movements: readonly Movement[] }) {
  const { colors } = useTheme()
  const [chosen, setChosen] = useState<Currency>('ARS')
  const present = CURRENCIES.filter((c) => movements.some((m) => m.amount.currency === c))
  const currency = present.includes(chosen) ? chosen : (present[0] ?? 'ARS')
  const summary = summarizeMonth(movements)[currency]

  return (
    <View style={styles.summary}>
      {present.length > 1 && (
        <Segmented
          label="Moneda"
          options={CURRENCY_OPTIONS}
          value={currency}
          onChange={setChosen}
        />
      )}
      <View accessible accessibilityLabel={`Resultado del mes: ${formatSignedMoney(summary.net)}`}>
        <AppText muted>Resultado del mes</AppText>
        <AppText mono weight="medium" style={styles.net} adjustsFontSizeToFit numberOfLines={1}>
          {formatSignedMoney(summary.net)}
        </AppText>
      </View>
      <View style={styles.stats}>
        <Stat label="Ingresos" value={formatMoney(summary.income)} color={colors.income} />
        <Stat label="Gastos" value={formatMoney(summary.expense)} />
      </View>
    </View>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  const { colors } = useTheme()
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.stat, { backgroundColor: colors.surfaceLow }]}
    >
      <AppText size="caption" muted>
        {label}
      </AppText>
      <AppText mono weight="medium" color={color} adjustsFontSizeToFit numberOfLines={1}>
        {value}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  summary: { gap: 16, paddingVertical: 8 },
  net: { fontSize: 40, lineHeight: 48 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, gap: 2 },
})
