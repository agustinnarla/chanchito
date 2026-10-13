export type Theme = 'light' | 'dark'

/** Same key as the inline script in index.html, which applies the theme before the first paint. */
export const THEME_STORAGE_KEY = 'chanchito:theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** The theme the person chose, if any. Storage can be blocked: then there is none. */
export function readStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Blocked storage: the choice lasts until the page reloads.
  }
}

export function systemTheme(): Theme {
  return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** Calls `onChange` when the system theme changes; returns the unsubscribe function. */
export function watchSystemTheme(onChange: (theme: Theme) => void): () => void {
  const query = window.matchMedia?.(DARK_QUERY)
  if (!query) return () => {}
  const listener = (event: MediaQueryListEvent) => onChange(event.matches ? 'dark' : 'light')
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}
