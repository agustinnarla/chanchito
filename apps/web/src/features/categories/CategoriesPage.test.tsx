import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeCategoriesApi } from '@/test/fake-categories-api'
import { renderWithQuery } from '@/test/render-with-query'
import { CategoriesPage } from './CategoriesPage'

const api = vi.hoisted(() => ({ fake: null as ReturnType<typeof createFakeCategoriesApi> | null }))

vi.mock('./api', async () => {
  const { createFakeCategoriesApi } = await import('@/test/fake-categories-api')
  api.fake = createFakeCategoriesApi()
  return api.fake
})

function fakeApi() {
  if (!api.fake) throw new Error('api mock not initialized')
  return api.fake
}

function section(name: 'Gastos' | 'Ingresos') {
  return screen.getByRole('region', { name })
}

function namesIn(name: 'Gastos' | 'Ingresos') {
  return within(section(name))
    .queryAllByRole('listitem')
    .map((item) => item.textContent)
}

async function createCategory(name: string, kind: 'Gasto' | 'Ingreso' = 'Gasto') {
  const user = userEvent.setup()
  const form = await screen.findByRole('form', { name: 'Nueva categoría' })
  const input = within(form).getByLabelText('Nombre')
  await user.clear(input)
  await user.type(input, name)
  await user.click(within(form).getByRole('radio', { name: kind }))
  await user.click(within(form).getByRole('button', { name: 'Crear' }))
}

describe('CategoriesPage', () => {
  beforeEach(async () => {
    await import('./api')
    fakeApi().reset()
  })

  it('lists categories by kind in alphabetical order', async () => {
    fakeApi().reset([
      { name: 'Salud', kind: 'expense' },
      { name: 'Sueldo', kind: 'income' },
      { name: 'Alquiler', kind: 'expense' },
      { name: 'Educación', kind: 'expense' },
    ])
    renderWithQuery(<CategoriesPage />)

    await screen.findByText('Alquiler')
    expect(namesIn('Gastos')).toEqual(['Alquiler', 'Educación', 'Salud'])
    expect(namesIn('Ingresos')).toEqual(['Sueldo'])
  })

  it('says when a section is empty', async () => {
    fakeApi().reset([{ name: 'Sueldo', kind: 'income' }])
    renderWithQuery(<CategoriesPage />)

    expect(await screen.findByText('Todavía no tenés categorías de gasto.')).toBeInTheDocument()
  })

  it('creates an expense category and shows it in order', async () => {
    fakeApi().reset([
      { name: 'Alquiler', kind: 'expense' },
      { name: 'Salud', kind: 'expense' },
    ])
    renderWithQuery(<CategoriesPage />)

    await createCategory('Comida')

    expect(await within(section('Gastos')).findByText('Comida')).toBeInTheDocument()
    expect(namesIn('Gastos')).toEqual(['Alquiler', 'Comida', 'Salud'])
    expect(screen.getByLabelText('Nombre')).toHaveValue('')
  })

  it('defaults the kind to Gasto', async () => {
    renderWithQuery(<CategoriesPage />)

    expect(await screen.findByRole('radio', { name: 'Gasto' })).toBeChecked()
  })

  it('normalizes the name', async () => {
    renderWithQuery(<CategoriesPage />)

    await createCategory('  Café   con leche ')

    expect(await within(section('Gastos')).findByText('Café con leche')).toBeInTheDocument()
  })

  it('shows an error for a duplicate name of the same kind and keeps what was typed', async () => {
    fakeApi().reset([{ name: 'Comida', kind: 'expense' }])
    renderWithQuery(<CategoriesPage />)

    await createCategory('comida')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya existe una categoría de gasto con ese nombre.',
    )
    expect(screen.getByLabelText('Nombre')).toHaveValue('comida')
  })

  it('allows the same name with the other kind', async () => {
    fakeApi().reset([{ name: 'Otros', kind: 'expense' }])
    renderWithQuery(<CategoriesPage />)

    await createCategory('Otros', 'Ingreso')

    expect(await within(section('Ingresos')).findByText('Otros')).toBeInTheDocument()
  })

  it.each([
    ['an empty name', '   ', 'Ingresá un nombre.'],
    [
      'a name longer than 50 characters',
      'a'.repeat(51),
      'El nombre puede tener hasta 50 caracteres.',
    ],
  ])('shows an error for %s', async (_case, name, message) => {
    renderWithQuery(<CategoriesPage />)

    await createCategory(name)

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(fakeApi().all()).toEqual([])
  })

  it('shows an error when the list cannot be loaded', async () => {
    fakeApi().listCategories.mockRejectedValueOnce(new Error('offline'))
    renderWithQuery(<CategoriesPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las categorías.',
    )
  })
})
