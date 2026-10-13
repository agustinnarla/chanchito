import type { Accent, ThemePreference } from '@chanchito/core'
import { useEffect, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { shouldAnimate } from '@/lib/motion'
import {
  applyAccent,
  applyTheme,
  readStoredAccent,
  readStoredPreference,
  revealTheme,
  storeAccent,
  storePreference,
  systemTheme,
  watchSystemTheme,
  type Point,
} from './theme'
import { ThemeContext } from './theme-context'

/**
 * Runs `update` inside a view transition that reveals the new look in a circle from `origin`
 * (spec 007). Without an origin, motion or view transitions, it just updates.
 */
function reveal(origin: Point | undefined, update: () => void) {
  if (!origin || !shouldAnimate() || !('startViewTransition' in document)) {
    update()
    return
  }
  // The whole page is revealed, not the page crossfaded on its own (see index.css)
  const root = document.documentElement
  root.classList.add('theme-reveal')
  // The page must change inside the transition, so React renders right away
  const transition = document.startViewTransition(() => flushSync(update))
  transition.ready.then(() => revealTheme(origin)).catch(() => {})
  transition.finished.finally(() => root.classList.remove('theme-reveal')).catch(() => {})
}

/**
 * The look of the app (spec 011): the theme, chosen per device (system, light or dark), and the
 * accent color, which comes from the account. The inline script in index.html already applied
 * both before the first paint, so there is no flash.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState(readStoredPreference)
  const [system, setSystem] = useState(systemTheme)
  const [accent, setAccentState] = useState(readStoredAccent)
  const theme = preference === 'system' ? system : preference

  useEffect(() => watchSystemTheme(setSystem), [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    applyAccent(accent)
  }, [accent])

  function setPreference(next: ThemePreference, origin?: Point) {
    storePreference(next)
    const nextTheme = next === 'system' ? system : next
    reveal(nextTheme === theme ? undefined : origin, () => {
      setPreferenceState(next)
      applyTheme(nextTheme)
    })
  }

  function setAccent(next: Accent, origin?: Point) {
    storeAccent(next)
    reveal(next === accent ? undefined : origin, () => {
      setAccentState(next)
      applyAccent(next)
    })
  }

  function toggleTheme(origin?: Point) {
    setPreference(theme === 'dark' ? 'light' : 'dark', origin)
  }

  return (
    <ThemeContext value={{ theme, preference, setPreference, toggleTheme, accent, setAccent }}>
      {children}
    </ThemeContext>
  )
}
