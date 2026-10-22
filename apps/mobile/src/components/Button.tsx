import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { useTheme } from '@/theme/use-theme'
import { AppText } from './AppText'
import { Icon } from './Icon'
import type { IconName } from './icons'

type Props = {
  label: string
  onPress: () => void
  /** Primary for the screen's main action, tonal for the rest, text for the least important. */
  variant?: 'primary' | 'tonal' | 'text' | 'destructive'
  icon?: IconName
  disabled?: boolean
  /** Shows a spinner and ignores presses, keeping the label for screen readers. */
  loading?: boolean
}

/** A Material 3 pill button. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
}: Props) {
  const { colors } = useTheme()
  const palette = {
    primary: { background: colors.primary, foreground: colors.primaryForeground },
    tonal: { background: colors.surfaceHigh, foreground: colors.foreground },
    text: { background: 'transparent', foreground: colors.link },
    destructive: { background: colors.badChip, foreground: colors.badOnChip },
  }[variant]
  const inactive = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      android_ripple={{ color: colors.border, borderless: false }}
      style={[styles.button, { backgroundColor: palette.background, opacity: disabled ? 0.5 : 1 }]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.foreground} />
        ) : (
          icon && <Icon name={icon} color={palette.foreground} size={20} />
        )}
        <AppText weight="semibold" color={palette.foreground}>
          {label}
        </AppText>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 24,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
})
