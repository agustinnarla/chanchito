import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeDb } from '@/test/fake-db'
import { renderWithQuery } from '@/test/render-with-query'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { AccentSync } from './AccentSync'
import { AppearanceButton } from './AppearanceButton'

vi.mock(
  '@/features/appearance/api',
  async () => (await import('@/test/fake-db')).fakeDb.appearanceApi,
)

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  delete document.documentElement.dataset.accent
  fakeDb.reset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderAppearance() {
  renderWithQuery(
    <ThemeProvider>
      <AccentSync />
      <AppearanceButton showLabel />
    </ThemeProvider>,
  )
}

async function openDialog() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Apariencia' }))
  return { user, dialog: await screen.findByRole('dialog', { name: 'Apariencia' }) }
}

describe('Appearance', () => {
  it('offers the six colors, green chosen by default', async () => {
    renderAppearance()
    const { dialog } = await openDialog()

    const colors = within(within(dialog).getByRole('radiogroup', { name: 'Color' })).getAllByRole(
      'radio',
    )
    expect(colors.map((c) => c.textContent)).toEqual([
      'Verde',
      'Azul',
      'Violeta',
      'Rosa',
      'Naranja',
      'Turquesa',
    ])
    expect(within(dialog).getByRole('radio', { name: 'Verde' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(within(dialog).getByRole('radio', { name: 'Sistema' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('applies a color at once and saves it in the account and the browser', async () => {
    renderAppearance()
    const { user, dialog } = await openDialog()

    await user.click(within(dialog).getByRole('radio', { name: 'Violeta' }))

    expect(document.documentElement.dataset.accent).toBe('violeta')
    expect(within(dialog).getByRole('radio', { name: 'Violeta' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await waitFor(() => expect(fakeDb.accent()).toBe('violeta'))
    expect(localStorage.getItem('chanchito:accent')).toBe('violeta')
  })

  it('moves between colors with the arrow keys', async () => {
    renderAppearance()
    const { user, dialog } = await openDialog()

    within(dialog).getByRole('radio', { name: 'Verde' }).focus()
    await user.keyboard('{ArrowRight}')

    expect(document.documentElement.dataset.accent).toBe('azul')
    expect(within(dialog).getByRole('radio', { name: 'Azul' })).toHaveFocus()
  })

  it('keeps the color in the browser and warns when the account fails', async () => {
    fakeDb.appearanceApi.saveAccent.mockRejectedValueOnce(new Error('offline'))
    renderAppearance()
    const { user, dialog } = await openDialog()

    await user.click(within(dialog).getByRole('radio', { name: 'Rosa' }))

    expect(await screen.findByText('No se pudo guardar el color en tu cuenta.')).toBeInTheDocument()
    expect(document.documentElement.dataset.accent).toBe('rosa')
    expect(localStorage.getItem('chanchito:accent')).toBe('rosa')
  })

  it('chooses the theme for this device', async () => {
    renderAppearance()
    const { user, dialog } = await openDialog()

    await user.click(within(dialog).getByRole('radio', { name: 'Oscuro' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('chanchito:theme')).toBe('dark')

    await user.click(within(dialog).getByRole('radio', { name: 'Claro' }))
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it("brings the account's color, over the one this browser remembered", async () => {
    localStorage.setItem('chanchito:accent', 'azul')
    fakeDb.reset({ accent: 'naranja' })
    renderAppearance()

    await waitFor(() => expect(document.documentElement.dataset.accent).toBe('naranja'))
    expect(localStorage.getItem('chanchito:accent')).toBe('naranja')
  })
})
