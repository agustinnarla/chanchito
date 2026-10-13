import { useEffect, useState, type ReactNode } from 'react'
import { applyTheme, readStoredTheme, storeTheme, systemTheme, watchSystemTheme } from './theme'
import { ThemeContext } from './theme-context'

/**
 * Follows the system theme until the person picks one, which is remembered. The inline script
 * in index.html already applied it before the first paint, so there is no flash.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [chosen, setChosen] = useState(readStoredTheme)
  const [system, setSystem] = useState(systemTheme)
  const theme = chosen ?? system

  useEffect(() => watchSystemTheme(setSystem), [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    storeTheme(next)
    setChosen(next)
  }

  return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>
}
