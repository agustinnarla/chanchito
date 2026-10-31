import { Pressable, StyleSheet, View } from 'react-native'
import { useTheme } from '@/theme/use-theme'
import { AppText } from './AppText'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  /** What is being chosen, for screen readers. */
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
}

/** A Material 3 segmented button: a pill with one option chosen. */
export function Segmented<T extends string>({ label, options, value, onChange }: Props<T>) {
  const { colors } = useTheme()
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[styles.group, { backgroundColor: colors.surface }]}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && { backgroundColor: colors.active }]}
          >
            <AppText
              size="caption"
              weight="semibold"
              color={selected ? colors.activeForeground : colors.mutedForeground}
            >
              {option.label}
            </AppText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', borderRadius: 999, padding: 4, alignSelf: 'flex-start' },
  option: { minHeight: 40, paddingHorizontal: 16, borderRadius: 999, justifyContent: 'center' },
})
