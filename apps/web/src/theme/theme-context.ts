import { createContext, useContext } from 'react'
import type { Point, Theme } from './theme'

export type ThemeContextValue = {
  theme: Theme
  /** With an `origin`, the new theme is revealed from there (if the browser and the person allow it). */
  toggleTheme: (origin?: Point) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}
