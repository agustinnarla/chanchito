import type { Accent, ThemePreference } from '@chanchito/core'
import { createContext, useContext } from 'react'
import type { Point, Theme } from './theme'

export type ThemeContextValue = {
  /** The theme in use: the chosen one, or the system's. */
  theme: Theme
  preference: ThemePreference
  /** With an `origin`, the change is revealed from there (if the browser and the person allow it). */
  setPreference: (preference: ThemePreference, origin?: Point) => void
  toggleTheme: (origin?: Point) => void
  accent: Accent
  setAccent: (accent: Accent, origin?: Point) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}
