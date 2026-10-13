import {
  DEFAULT_ACCENT,
  resolveAccent,
  resolveThemePreference,
  type Accent,
  type ThemePreference,
} from '@chanchito/core'

export type Theme = 'light' | 'dark'

/** Same keys as the inline script in index.html, which applies both before the first paint. */
export const THEME_STORAGE_KEY = 'chanchito:theme'
export const ACCENT_STORAGE_KEY = 'chanchito:accent'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function store(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Blocked storage: the choice lasts until the page reloads.
  }
}

/** This device's theme choice (spec 011): system, light or dark. Blocked storage: system. */
export function readStoredPreference(): ThemePreference {
  return resolveThemePreference(read(THEME_STORAGE_KEY))
}

export function storePreference(preference: ThemePreference): void {
  store(THEME_STORAGE_KEY, preference)
}

/** The last accent this browser saw, until the account's arrives. Blocked storage: green. */
export function readStoredAccent(): Accent {
  return resolveAccent(read(ACCENT_STORAGE_KEY))
}

export function storeAccent(accent: Accent): void {
  store(ACCENT_STORAGE_KEY, accent)
}

/** Green is the default tokens in index.css; the others replace them (palettes.css). */
export function applyAccent(accent: Accent): void {
  const root = document.documentElement
  if (accent === DEFAULT_ACCENT) delete root.dataset.accent
  else root.dataset.accent = accent
}

export function systemTheme(): Theme {
  return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export type Point = { x: number; y: number }

/**
 * Reveals the new theme in a circle growing from `origin` until it covers the screen. Called once
 * a view transition is ready: it animates its new snapshot (GSAP can't reach that pseudo-element).
 */
export function revealTheme({ x, y }: Point): void {
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  document.documentElement.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
    {
      duration: 500,
      easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
      pseudoElement: '::view-transition-new(root)',
    },
  )
}

/** Calls `onChange` when the system theme changes; returns the unsubscribe function. */
export function watchSystemTheme(onChange: (theme: Theme) => void): () => void {
  const query = window.matchMedia?.(DARK_QUERY)
  if (!query) return () => {}
  const listener = (event: MediaQueryListEvent) => onChange(event.matches ? 'dark' : 'light')
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}
