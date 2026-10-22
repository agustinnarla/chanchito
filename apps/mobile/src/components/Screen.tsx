import type { ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/theme/use-theme'

/** A full screen on the theme's background, clear of the status and navigation bars. */
export function Screen({ children }: { children: ReactNode }) {
  const { colors } = useTheme()
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({ screen: { flex: 1, paddingHorizontal: 16 } })
