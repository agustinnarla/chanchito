import { addMonths, formatMonthLabel, type Month } from '@chanchito/core'
import { StyleSheet, View } from 'react-native'
import { AppText } from './AppText'
import { IconButton } from './IconButton'

type Props = { month: Month; onChange: (month: Month) => void }

/** ← Octubre 2026 → */
export function MonthNavigation({ month, onChange }: Props) {
  return (
    <View style={styles.row}>
      <IconButton
        icon="chevron_left"
        label="Mes anterior"
        onPress={() => onChange(addMonths(month, -1))}
      />
      <AppText accessibilityRole="header" size="title" weight="bold" style={styles.label}>
        {formatMonthLabel(month)}
      </AppText>
      <IconButton
        icon="chevron_right"
        label="Mes siguiente"
        onPress={() => onChange(addMonths(month, 1))}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { flex: 1, textAlign: 'center' },
})
