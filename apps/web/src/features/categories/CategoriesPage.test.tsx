import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeDb } from '@/test/fake-db'
import { renderWithQuery } from '@/test/render-with-query'
import { CategoriesPage } from './CategoriesPage'
import { CategoryError } from '@chanchito/data'

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

async function openNew() {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Nueva categoría' }))
  const dialog = await screen.findByRole('dialog', { name: 'Nueva categoría' })
  return { user, dialog }
}

async function createCategory(name: string, kind: 'Gasto' | 'Ingreso' = 'Gasto') {
  const { user, dialog } = await openNew()
  await user.type(within(dialog).getByLabelText('Nombre'), name)
  await user.click(within(dialog).getByRole('radio', { name: kind }))
  await user.click(within(dialog).getByRole('button', { name: 'Crear' }))
  return { user, dialog }
}

async function openEdit(name: string) {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: `Editar ${name}` }))
  const dialog = await screen.findByRole('dialog', { name: 'Editar categoría' })
  return { user, dialog }
}

async function openArchived(user = userEvent.setup()) {
  await user.click(await screen.findByRole('button', { name: /^Archivadas/ }))
  return section('Archivadas')
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    fakeDb.reset()
  })

  it('shows categories by kind as tiles with their emoji, in alphabetical order', async () => {
    fakeDb.reset({
      categories: [
        { name: 'Salud', kind: 'expense', emoji: 'pill' },
        { name: 'Sueldo', kind: 'income' },
        { name: 'Alquiler', kind: 'expense' },
        { name: 'Educación', kind: 'expense' },
      ],
    })
    renderWithQuery(<CategoriesPage />)

    await screen.findByText('Alquiler')
    expect(namesIn('Gastos')).toEqual(['Alquiler', 'Educación', 'Salud'])
    expect(namesIn('Ingresos')).toEqual(['Sueldo'])
    expect(
      within(section('Gastos')).getByRole('button', { name: 'Editar Salud' }).querySelector('img'),
    ).toHaveAttribute('src', '/emoji/pill.webp')
  })

  it('says when a section is empty', async () => {
    fakeDb.reset({ categories: [{ name: 'Sueldo', kind: 'income' }] })
    renderWithQuery(<CategoriesPage />)

    expect(await screen.findByText('Todavía no tenés categorías de gasto.')).toBeInTheDocument()
  })

  describe('create', () => {
    it('creates an expense category and shows it in order', async () => {
      fakeDb.reset({ categories: [{ name: 'Salud', kind: 'expense' }] })
      renderWithQuery(<CategoriesPage />)

      await createCategory('Comida')

      expect(await screen.findByText('Categoría creada')).toBeInTheDocument()
      await waitFor(() => expect(namesIn('Gastos')).toEqual(['Comida', 'Salud']))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('defaults to Gasto and the package emoji', async () => {
      renderWithQuery(<CategoriesPage />)
      const { dialog } = await openNew()

      expect(within(dialog).getByRole('radio', { name: 'Gasto' })).toBeChecked()
      expect(within(dialog).getByRole('radio', { name: 'Paquete' })).toBeChecked()
    })

    it('saves the chosen emoji', async () => {
      renderWithQuery(<CategoriesPage />)
      const { user, dialog } = await openNew()

      await user.type(within(dialog).getByLabelText('Nombre'), 'Café')
      await user.click(within(dialog).getByRole('radio', { name: 'Café' }))
      await user.click(within(dialog).getByRole('button', { name: 'Crear' }))

      await waitFor(() =>
        expect(fakeDb.categories()).toMatchObject([{ name: 'Café', emoji: 'hot_beverage' }]),
      )
    })

    it('normalizes the name', async () => {
      renderWithQuery(<CategoriesPage />)

      await createCategory('  Café   con leche ')

      await waitFor(() => expect(namesIn('Gastos')).toEqual(['Café con leche']))
    })

    it('shows an error for a duplicate name of the same kind and keeps what was typed', async () => {
      fakeDb.reset({ categories: [{ name: 'Comida', kind: 'expense' }] })
      renderWithQuery(<CategoriesPage />)

      const { dialog } = await createCategory('comida')

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'Ya existe una categoría de gasto con ese nombre.',
      )
      expect(within(dialog).getByLabelText('Nombre')).toHaveValue('comida')
      expect(within(dialog).getByLabelText('Nombre')).toHaveAccessibleDescription(
        'Ya existe una categoría de gasto con ese nombre.',
      )
    })

    it('allows the same name with the other kind', async () => {
      fakeDb.reset({ categories: [{ name: 'Otros', kind: 'expense' }] })
      renderWithQuery(<CategoriesPage />)

      await createCategory('Otros', 'Ingreso')

      await waitFor(() => expect(namesIn('Ingresos')).toEqual(['Otros']))
      expect(namesIn('Gastos')).toEqual(['Otros'])
    })

    it('suggests restoring when the name is taken by an archived category', async () => {
      fakeDb.reset({ categories: [{ name: 'Supermercado', kind: 'expense', archived: true }] })
      renderWithQuery(<CategoriesPage />)

      const { dialog } = await createCategory('supermercado')

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'Ya existe una categoría de gasto archivada con ese nombre. Restaurala desde «Archivadas».',
      )
    })
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

  describe('edit', () => {
    beforeEach(() => {
      fakeDb.reset({
        categories: [
          { name: 'Cine', kind: 'expense' },
          { name: 'Salidas', kind: 'expense', emoji: 'clinking_beer_mugs' },
        ],
      })
    })

    it('opens with the name and emoji, without changing the kind', async () => {
      renderWithQuery(<CategoriesPage />)
      const { dialog } = await openEdit('Salidas')

      expect(within(dialog).getByLabelText('Nombre')).toHaveValue('Salidas')
      expect(within(dialog).getByRole('radio', { name: 'Cervezas' })).toBeChecked()
      expect(within(dialog).queryByRole('radiogroup', { name: 'Tipo' })).not.toBeInTheDocument()
      expect(dialog).toHaveTextContent('Categoría de gasto.')
    })

    it('renames and changes the emoji', async () => {
      renderWithQuery(<CategoriesPage />)
      const { user, dialog } = await openEdit('Salidas')

      const input = within(dialog).getByLabelText('Nombre')
      await user.clear(input)
      await user.type(input, 'Bares')
      await user.click(within(dialog).getByRole('radio', { name: 'Pizza' }))
      await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

      expect(await screen.findByText('Categoría guardada')).toBeInTheDocument()
      await waitFor(() => expect(namesIn('Gastos')).toEqual(['Bares', 'Cine']))
      expect(fakeDb.categories().find((c) => c.name === 'Bares')?.emoji).toBe('pizza')
    })

    it('shows an error when renaming to an existing name', async () => {
      renderWithQuery(<CategoriesPage />)
      const { user, dialog } = await openEdit('Salidas')

      const input = within(dialog).getByLabelText('Nombre')
      await user.clear(input)
      await user.type(input, 'cine')
      await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'Ya existe una categoría de gasto con ese nombre.',
      )
    })

    it('does not save when nothing changed', async () => {
      renderWithQuery(<CategoriesPage />)
      const { user, dialog } = await openEdit('Cine')

      await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(api.updateCategory).not.toHaveBeenCalled()
    })

    it('cancels with Escape without saving', async () => {
      renderWithQuery(<CategoriesPage />)
      const { user, dialog } = await openEdit('Cine')

      await user.type(within(dialog).getByLabelText('Nombre'), ' 2')
      await user.keyboard('{Escape}')

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(namesIn('Gastos')).toEqual(['Cine', 'Salidas'])
      expect(api.updateCategory).not.toHaveBeenCalled()
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

    async function openDelete(name: string) {
      const { user, dialog } = await openEdit(name)
      await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))
      return {
        user,
        dialog: await screen.findByRole('alertdialog', { name: `¿Eliminar «${name}»?` }),
      }
    }

    it('asks for confirmation from the edit dialog and deletes the category', async () => {
      renderWithQuery(<CategoriesPage />)
      const { user, dialog } = await openDelete('Cine')

      await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

      await waitFor(() => expect(namesIn('Gastos')).toEqual(['Salidas']))
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })

    it('keeps the category when cancelling', async () => {
      renderWithQuery(<CategoriesPage />)
      const { user, dialog } = await openDelete('Cine')

      await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
      expect(namesIn('Gastos')).toEqual(['Cine', 'Salidas'])
      expect(api.deleteCategory).not.toHaveBeenCalled()
    })

    it('shows the error inside the dialog when deleting fails', async () => {
      api.deleteCategory.mockRejectedValueOnce(
        new CategoryError('No se pudo eliminar la categoría. Probá de nuevo.'),
      )
      renderWithQuery(<CategoriesPage />)
      const { user, dialog } = await openDelete('Cine')

      await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'No se pudo eliminar la categoría.',
      )
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
      expect(fakeDb.categories().find((c) => c.name === 'Sueldo')?.emoji).toBe('briefcase')
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

    async function deleteFromEdit(name: string) {
      const { user, dialog } = await openEdit(name)
      await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))
      const confirm = await screen.findByRole('alertdialog')
      await user.click(within(confirm).getByRole('button', { name: 'Eliminar' }))
      return user
    }

    it('explains in the confirmation that a category with movements gets archived', async () => {
      renderWithQuery(<CategoriesPage />)
      const { user, dialog } = await openEdit('Supermercado')

      await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

      expect(await screen.findByRole('alertdialog')).toHaveTextContent(
        'Si tiene movimientos, se va a archivar en vez de eliminarse.',
      )
    })

    it('archives a category with movements instead of deleting it, and says so', async () => {
      renderWithQuery(<CategoriesPage />)

      const user = await deleteFromEdit('Supermercado')

      expect(
        await screen.findByText('«Supermercado» tiene movimientos, así que se archivó.'),
      ).toBeInTheDocument()
      await waitFor(() => expect(namesIn('Gastos')).toEqual(['Salidas']))
      const archived = await openArchived(user)
      expect(within(archived).getByText('Supermercado')).toBeInTheDocument()
      expect(within(archived).getByText('(Gasto)')).toBeInTheDocument()
    })

    it('deletes a category without movements', async () => {
      renderWithQuery(<CategoriesPage />)

      await deleteFromEdit('Salidas')

      await waitFor(() => expect(namesIn('Gastos')).toEqual(['Supermercado']))
      expect(screen.queryByRole('region', { name: 'Archivadas' })).not.toBeInTheDocument()
    })

    it('keeps archived ones folded until opened', async () => {
      fakeDb.reset({ categories: [{ name: 'Supermercado', kind: 'expense', archived: true }] })
      renderWithQuery(<CategoriesPage />)

      const toggle = await screen.findByRole('button', { name: 'Archivadas (1)' })
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(
        screen.queryByRole('button', { name: 'Restaurar Supermercado' }),
      ).not.toBeInTheDocument()

      await openArchived()
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
    })

    it('restores an archived category', async () => {
      fakeDb.reset({
        categories: [{ name: 'Supermercado', kind: 'expense', archived: true }],
        movements: [{ category: 'Supermercado' }],
      })
      renderWithQuery(<CategoriesPage />)
      const user = userEvent.setup()
      await openArchived(user)

      await user.click(screen.getByRole('button', { name: 'Restaurar Supermercado' }))

      expect(await screen.findByText('Se restauró «Supermercado».')).toBeInTheDocument()
      await waitFor(() => expect(namesIn('Gastos')).toEqual(['Supermercado']))
      expect(screen.queryByRole('region', { name: 'Archivadas' })).not.toBeInTheDocument()
    })

    it('does not offer editing an archived category', async () => {
      fakeDb.reset({ categories: [{ name: 'Supermercado', kind: 'expense', archived: true }] })
      renderWithQuery(<CategoriesPage />)
      await openArchived()

      expect(screen.getByRole('button', { name: 'Restaurar Supermercado' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Editar Supermercado' })).not.toBeInTheDocument()
    })

    it('cannot delete an archived category that has movements', async () => {
      fakeDb.reset({
        categories: [{ name: 'Supermercado', kind: 'expense', archived: true }],
        movements: [{ category: 'Supermercado' }],
      })
      renderWithQuery(<CategoriesPage />)
      const user = userEvent.setup()
      await openArchived(user)

      await user.click(screen.getByRole('button', { name: 'Eliminar Supermercado' }))
      const confirm = await screen.findByRole('alertdialog')
      await user.click(within(confirm).getByRole('button', { name: 'Eliminar' }))

      expect(await within(confirm).findByRole('alert')).toHaveTextContent(
        '«Supermercado» tiene movimientos, así que no se puede eliminar.',
      )
    })
  })
})
