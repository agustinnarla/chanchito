import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY } from './theme'
import { useTheme } from './theme-context'
import { ThemeProvider } from './ThemeProvider'

let systemDark = false
let listeners: ((event: { matches: boolean }) => void)[] = []

beforeEach(() => {
  systemDark = false
  listeners = []
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: systemDark,
    media: query,
    addEventListener: (_: string, l: (event: { matches: boolean }) => void) => listeners.push(l),
    removeEventListener: vi.fn(),
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function Probe() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button type="button" onClick={toggleTheme}>
      Tema {theme}
    </button>
  )
}

const renderProbe = () =>
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  )

const isDark = () => document.documentElement.classList.contains('dark')

describe('ThemeProvider', () => {
  it('follows the system theme by default', () => {
    systemDark = true
    renderProbe()

    expect(screen.getByRole('button')).toHaveTextContent('Tema dark')
    expect(isDark()).toBe(true)
  })

  it('reacts when the system theme changes', async () => {
    renderProbe()
    expect(isDark()).toBe(false)

    await vi.waitFor(() => expect(listeners).toHaveLength(1))
    listeners[0]?.({ matches: true })

    expect(await screen.findByText('Tema dark')).toBeInTheDocument()
    expect(isDark()).toBe(true)
  })

  it('toggles and remembers the choice', async () => {
    renderProbe()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveTextContent('Tema dark')
    expect(isDark()).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('prefers the stored choice over the system', () => {
    systemDark = true
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    renderProbe()

    expect(screen.getByRole('button')).toHaveTextContent('Tema light')
    expect(isDark()).toBe(false)
  })

  it('works when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    renderProbe()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveTextContent('Tema dark')
  })

  it('fails clearly outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow('useTheme must be used inside ThemeProvider')
  })
})
