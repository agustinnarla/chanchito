import { useEffect, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { shouldAnimate } from '@/lib/motion'
import {
  applyTheme,
  readStoredTheme,
  revealTheme,
  storeTheme,
  systemTheme,
  watchSystemTheme,
  type Point,
} from './theme'
import { ThemeContext } from './theme-context'

/**
 * Follows the system theme until the person picks one, which is remembered. The inline script
 * in index.html already applied it before the first paint, so there is no flash. Changing it from
 * the button reveals the new theme in a circle (spec 007).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [chosen, setChosen] = useState(readStoredTheme)
  const [system, setSystem] = useState(systemTheme)
  const theme = chosen ?? system

  useEffect(() => watchSystemTheme(setSystem), [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function toggleTheme(origin?: Point) {
    const next = theme === 'dark' ? 'light' : 'dark'
    storeTheme(next)
    if (!origin || !shouldAnimate() || !('startViewTransition' in document)) {
      setChosen(next)
      return
    }
    // The whole page is revealed, not the page crossfaded on its own (see index.css)
    const root = document.documentElement
    root.classList.add('theme-reveal')
    // The page must change inside the transition, so React renders right away
    const transition = document.startViewTransition(() => {
      flushSync(() => setChosen(next))
      applyTheme(next)
    })
    transition.ready.then(() => revealTheme(origin)).catch(() => {})
    transition.finished.finally(() => root.classList.remove('theme-reveal')).catch(() => {})
  }

  return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>
}
