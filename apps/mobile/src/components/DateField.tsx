import { formatDate, todayIso, type IsoDate } from '@chanchito/core'
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { Pressable, StyleSheet, View } from 'react-native'
import { useTheme } from '@/theme/use-theme'
import { AppText } from './AppText'
import { Icon } from './Icon'

type Props = { label: string; value: IsoDate; onChange: (date: IsoDate) => void; error?: string }

/** A date shown as dd/mm/aaaa that opens Android's date picker. */
export function DateField({ label, value, onChange, error }: Props) {
  const { colors } = useTheme()
  const [year, month, day] = value.split('-').map(Number) as [number, number, number]

  function open() {
    DateTimePickerAndroid.open({
      mode: 'date',
      value: new Date(year, month - 1, day),
      onChange: (event, date) => {
        // The local calendar day, never shifted by UTC
        if (event.type === 'set' && date) onChange(todayIso(date))
      },
    })
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${formatDate(value)}`}
      accessibilityHint={error ?? 'Abre el calendario'}
      onPress={open}
      style={styles.field}
    >
      <AppText size="caption" weight="medium" muted>
        {label}
      </AppText>
      <View
        style={[
          styles.box,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.destructive : 'transparent',
          },
        ]}
      >
        <Icon name="event" color={colors.mutedForeground} size={20} />
        <AppText>{formatDate(value)}</AppText>
      </View>
      {error && (
        <AppText size="caption" color={colors.destructive}>
          {error}
        </AppText>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  box: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
})
