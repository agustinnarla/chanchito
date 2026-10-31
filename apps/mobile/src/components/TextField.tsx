import { useState, type ComponentRef, type ReactNode, type Ref } from 'react'
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { fontFamily } from '@/theme/fonts'
import { useTheme } from '@/theme/use-theme'
import { AppText } from './AppText'

type Props = Omit<TextInputProps, 'style'> & {
  label: string
  /** An error under the field, read by screen readers with the label. */
  error?: string | null
  /** Something at the end of the field, like the button to show the password. */
  trailing?: ReactNode
  ref?: Ref<ComponentRef<typeof TextInput>>
}

/** A labeled text field on a tonal surface, with the ring color while focused. */
export function TextField({ label, error, trailing, ref, onFocus, onBlur, ...props }: Props) {
  const { colors } = useTheme()
  const [focused, setFocused] = useState(false)
  const borderColor = error ? colors.destructive : focused ? colors.ring : 'transparent'

  return (
    <View style={styles.field}>
      <AppText size="caption" weight="medium" muted>
        {label}
      </AppText>
      <View style={[styles.box, { backgroundColor: colors.surface, borderColor }]}>
        <TextInput
          {...props}
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? undefined}
          placeholderTextColor={colors.mutedForeground}
          cursorColor={colors.ring}
          selectionColor={colors.active}
          onFocus={(event) => {
            setFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            onBlur?.(event)
          }}
          style={[styles.input, { color: colors.foreground, fontFamily: fontFamily('regular') }]}
        />
        {trailing}
      </View>
      {error && (
        <AppText size="caption" color={colors.destructive}>
          {error}
        </AppText>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  box: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 4,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
})
