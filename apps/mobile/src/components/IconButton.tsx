import { Pressable, StyleSheet } from 'react-native'
import { useTheme } from '@/theme/use-theme'
import { Icon } from './Icon'
import type { IconName } from './icons'

type Props = {
  icon: IconName
  /** What the button does, for screen readers (it has no visible text). */
  label: string
  onPress: () => void
  disabled?: boolean
}

/** A round button with only an icon, 48 dp so it's easy to tap. */
export function IconButton({ icon, label, onPress, disabled = false }: Props) {
  const { colors } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: colors.border, borderless: true, radius: 24 }}
      style={[styles.button, { opacity: disabled ? 0.5 : 1 }]}
    >
      <Icon name={icon} color={colors.foreground} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
})
