import { CATEGORY_KIND_LABELS, type CategoryKind } from '@chanchito/core'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCreateCategory } from './hooks'

// Gasto first: it's the default and the most common
const KIND_OPTIONS: CategoryKind[] = ['expense', 'income']

export function CategoryForm() {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<CategoryKind>('expense')
  const create = useCreateCategory()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    create.mutate(
      { name, kind },
      {
        onSuccess: () => {
          setName('')
        },
      },
    )
  }

  return (
    <form
      aria-label="Nueva categoría"
      className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-end"
      onSubmit={handleSubmit}
    >
      <div className="flex-1 space-y-2">
        <Label htmlFor="category-name">Nombre</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            create.reset()
          }}
          aria-invalid={create.isError}
          aria-describedby={create.isError ? 'category-form-error' : undefined}
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Tipo</legend>
        <RadioGroup
          className="flex gap-4 py-2"
          value={kind}
          onValueChange={(value) => {
            setKind(value as CategoryKind)
            create.reset()
          }}
        >
          {KIND_OPTIONS.map((option) => (
            <div key={option} className="flex items-center gap-2">
              <RadioGroupItem id={`category-kind-${option}`} value={option} />
              <Label htmlFor={`category-kind-${option}`}>{CATEGORY_KIND_LABELS[option]}</Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>
      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? 'Creando…' : 'Crear'}
      </Button>
      {create.isError && (
        <p id="category-form-error" role="alert" className="text-sm text-destructive sm:basis-full">
          {create.error.message}
        </p>
      )}
    </form>
  )
}
