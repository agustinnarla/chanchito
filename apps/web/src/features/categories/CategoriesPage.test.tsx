import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeDb } from '@/test/fake-db'
import { renderWithQuery } from '@/test/render-with-query'
import { CategoriesPage } from './CategoriesPage'
import { CategoryError } from './errors'

vi.mock('./api', async () => (await import('@/test/fake-db')).fakeDb.categoriesApi)

const api = fakeDb.categoriesApi

function section(name: 'Gastos' | 'Ingresos' | 'Archivadas') {
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
  beforeEach(() => {
    fakeDb.reset()
  })

  it('lists categories by kind in alphabetical order', async () => {
    fakeDb.reset({
      categories: [
        { name: 'Salud', kind: 'expense' },
        { name: 'Sueldo', kind: 'income' },
        { name: 'Alquiler', kind: 'expense' },
        { name: 'Educación', kind: 'expense' },
      ],
    })
    renderWithQuery(<CategoriesPage />)

    await screen.findByText('Alquiler')
    expect(namesIn('Gastos')).toEqual(['Alquiler', 'Educación', 'Salud'])
    expect(namesIn('Ingresos')).toEqual(['Sueldo'])
  })

  it('says when a section is empty', async () => {
    fakeDb.reset({ categories: [{ name: 'Sueldo', kind: 'income' }] })
    renderWithQuery(<CategoriesPage />)

    expect(await screen.findByText('Todavía no tenés categorías de gasto.')).toBeInTheDocument()
  })

  it('creates an expense category and shows it in order', async () => {
    fakeDb.reset({
      categories: [
        { name: 'Alquiler', kind: 'expense' },
        { name: 'Salud', kind: 'expense' },
      ],
    })
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
    fakeDb.reset({ categories: [{ name: 'Comida', kind: 'expense' }] })
    renderWithQuery(<CategoriesPage />)

    await createCategory('comida')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya existe una categoría de gasto con ese nombre.',
    )
    expect(screen.getByLabelText('Nombre')).toHaveValue('comida')
  })

  it('allows the same name with the other kind', async () => {
    fakeDb.reset({ categories: [{ name: 'Otros', kind: 'expense' }] })
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
    expect(fakeDb.categories()).toEqual([])
  })

  it('shows an error when the list cannot be loaded and retries', async () => {
    fakeDb.reset({ categories: [{ name: 'Comida', kind: 'expense' }] })
    api.listCategories.mockRejectedValueOnce(new Error('offline'))
    renderWithQuery(<CategoriesPage />)
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las categorías.',
    )

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Comida')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  describe('rename', () => {
    beforeEach(() => {
      fakeDb.reset({
        categories: [
          { name: 'Cine', kind: 'expense' },
          { name: 'Salidas', kind: 'expense' },
        ],
      })
    })

    async function rename(from: string, to: string) {
      const user = userEvent.setup()
      await user.click(await screen.findByRole('button', { name: `Renombrar ${from}` }))
      const input = screen.getByLabelText('Nuevo nombre')
      await user.clear(input)
      await user.type(input, `${to}{Enter}`)
    }

    it('renames a category and updates the list', async () => {
      renderWithQuery(<CategoriesPage />)

      await rename('Salidas', 'Bares')

      expect(await within(section('Gastos')).findByText('Bares')).toBeInTheDocument()
      expect(namesIn('Gastos')).toEqual(['Bares', 'Cine'])
      expect(screen.queryByLabelText('Nuevo nombre')).not.toBeInTheDocument()
    })

    it('shows an error when renaming to an existing name', async () => {
      renderWithQuery(<CategoriesPage />)

      await rename('Salidas', 'CINE')

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Ya existe una categoría de gasto con ese nombre.',
      )
      expect(screen.getByLabelText('Nuevo nombre')).toHaveValue('CINE')
    })

    it('does not save when the name did not change', async () => {
      renderWithQuery(<CategoriesPage />)
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Renombrar Cine' }))
      await user.click(screen.getByRole('button', { name: 'Guardar' }))

      expect(screen.queryByLabelText('Nuevo nombre')).not.toBeInTheDocument()
      expect(api.renameCategory).not.toHaveBeenCalled()
    })

    it('cancels with Escape without saving', async () => {
      renderWithQuery(<CategoriesPage />)
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Renombrar Cine' }))
      await user.type(screen.getByLabelText('Nuevo nombre'), ' 2{Escape}')

      expect(screen.queryByLabelText('Nuevo nombre')).not.toBeInTheDocument()
      expect(namesIn('Gastos')).toEqual(['Cine', 'Salidas'])
      expect(api.renameCategory).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    beforeEach(() => {
      fakeDb.reset({
        categories: [
          { name: 'Cine', kind: 'expense' },
          { name: 'Salidas', kind: 'expense' },
        ],
      })
    })

    it('asks for confirmation and deletes the category', async () => {
      renderWithQuery(<CategoriesPage />)
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Eliminar Cine' }))
      const dialog = await screen.findByRole('alertdialog', { name: '¿Eliminar «Cine»?' })
      await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

      await waitFor(() => expect(namesIn('Gastos')).toEqual(['Salidas']))
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })

    it('keeps the category when cancelling', async () => {
      renderWithQuery(<CategoriesPage />)
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Eliminar Cine' }))
      await user.click(await screen.findByRole('button', { name: 'Cancelar' }))

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(namesIn('Gastos')).toEqual(['Cine', 'Salidas'])
      expect(api.deleteCategory).not.toHaveBeenCalled()
    })

    it('shows the error inside the dialog when deleting fails', async () => {
      api.deleteCategory.mockRejectedValueOnce(
        new CategoryError('No se pudo eliminar la categoría. Probá de nuevo.'),
      )
      renderWithQuery(<CategoriesPage />)
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Eliminar Cine' }))
      const dialog = await screen.findByRole('alertdialog')
      await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'No se pudo eliminar la categoría.',
      )
      // The rest of the page is hidden from assistive tech while the dialog is open.
      expect(fakeDb.categories().map((c) => c.name)).toEqual(['Cine', 'Salidas'])
    })
  })

  describe('suggested categories', () => {
    it('offers them when there are no categories and creates the 14 suggestions', async () => {
      renderWithQuery(<CategoriesPage />)
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Crear categorías sugeridas' }))

      expect(await within(section('Ingresos')).findByText('Sueldo')).toBeInTheDocument()
      expect(namesIn('Gastos')).toHaveLength(11)
      expect(namesIn('Ingresos')).toEqual(['Freelance', 'Otros ingresos', 'Sueldo'])
      expect(
        screen.queryByRole('button', { name: 'Crear categorías sugeridas' }),
      ).not.toBeInTheDocument()
    })

    it('does not offer them when there is at least one category', async () => {
      fakeDb.reset({ categories: [{ name: 'Comida', kind: 'expense' }] })
      renderWithQuery(<CategoriesPage />)

      await screen.findByText('Comida')
      expect(
        screen.queryByRole('button', { name: 'Crear categorías sugeridas' }),
      ).not.toBeInTheDocument()
    })

    it('shows an error when creating them fails', async () => {
      api.createSuggestedCategories.mockRejectedValueOnce(
        new CategoryError('No se pudo guardar. Revisá tu conexión y probá de nuevo.'),
      )
      renderWithQuery(<CategoriesPage />)
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Crear categorías sugeridas' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar.')
    })
  })

  describe('archive', () => {
    beforeEach(() => {
      fakeDb.reset({
        categories: [
          { name: 'Supermercado', kind: 'expense' },
          { name: 'Salidas', kind: 'expense' },
        ],
        movements: [{ category: 'Supermercado' }],
      })
    })

    async function deleteFromList(name: string) {
      const user = userEvent.setup()
      await user.click(await screen.findByRole('button', { name: `Eliminar ${name}` }))
      const dialog = await screen.findByRole('alertdialog')
      await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))
    }

    it('explains in the confirmation that a category with movements gets archived', async () => {
      renderWithQuery(<CategoriesPage />)
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Eliminar Supermercado' }))

      expect(await screen.findByRole('alertdialog')).toHaveTextContent(
        'Si tiene movimientos, se va a archivar en vez de eliminarse.',
      )
    })

    it('archives a category with movements instead of deleting it, and says so', async () => {
      renderWithQuery(<CategoriesPage />)

      await deleteFromList('Supermercado')

      expect(
        await screen.findByText('«Supermercado» tiene movimientos, así que se archivó.'),
      ).toBeInTheDocument()
      expect(namesIn('Gastos')).toEqual(['Salidas'])
      expect(within(section('Archivadas')).getByText('Supermercado')).toBeInTheDocument()
      expect(within(section('Archivadas')).getByText('(Gasto)')).toBeInTheDocument()
    })

    it('deletes a category without movements', async () => {
      renderWithQuery(<CategoriesPage />)

      await deleteFromList('Salidas')

      await waitFor(() => expect(namesIn('Gastos')).toEqual(['Supermercado']))
      expect(screen.queryByRole('region', { name: 'Archivadas' })).not.toBeInTheDocument()
    })

    it('restores an archived category', async () => {
      fakeDb.reset({
        categories: [{ name: 'Supermercado', kind: 'expense', archived: true }],
        movements: [{ category: 'Supermercado' }],
      })
      renderWithQuery(<CategoriesPage />)
      const user = userEvent.setup()

      await user.click(await screen.findByRole('button', { name: 'Restaurar Supermercado' }))

      expect(await screen.findByText('Se restauró «Supermercado».')).toBeInTheDocument()
      await waitFor(() => expect(namesIn('Gastos')).toEqual(['Supermercado']))
      expect(screen.queryByRole('region', { name: 'Archivadas' })).not.toBeInTheDocument()
    })

    it('does not offer renaming an archived category', async () => {
      fakeDb.reset({ categories: [{ name: 'Supermercado', kind: 'expense', archived: true }] })
      renderWithQuery(<CategoriesPage />)

      await screen.findByRole('button', { name: 'Restaurar Supermercado' })
      expect(
        screen.queryByRole('button', { name: 'Renombrar Supermercado' }),
      ).not.toBeInTheDocument()
    })

    it('cannot delete an archived category that has movements', async () => {
      fakeDb.reset({
        categories: [{ name: 'Supermercado', kind: 'expense', archived: true }],
        movements: [{ category: 'Supermercado' }],
      })
      renderWithQuery(<CategoriesPage />)

      await deleteFromList('Supermercado')

      expect(await screen.findByRole('alert')).toHaveTextContent(
        '«Supermercado» tiene movimientos, así que no se puede eliminar.',
      )
    })

    it('suggests restoring when creating a name taken by an archived category', async () => {
      fakeDb.reset({ categories: [{ name: 'Supermercado', kind: 'expense', archived: true }] })
      renderWithQuery(<CategoriesPage />)

      await createCategory('supermercado')

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Ya existe una categoría de gasto archivada con ese nombre. Restaurala desde «Archivadas».',
      )
    })
  })
})
