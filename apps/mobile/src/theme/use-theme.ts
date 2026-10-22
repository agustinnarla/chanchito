import { useColorScheme } from 'react-native'
import { COLORS, type Colors } from './colors'

export type Theme = { scheme: 'light' | 'dark'; colors: Colors }

/** The colors for the system's light or dark mode (light if the system doesn't say). */
export function useTheme(): Theme {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light'
  return { scheme, colors: COLORS[scheme] }
}
