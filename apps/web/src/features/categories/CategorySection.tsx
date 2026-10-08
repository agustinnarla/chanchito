import type { Category } from '@chanchito/core'
import { CategoryItem } from './CategoryItem'

type Props = {
  title: string
  emptyMessage: string
  categories: Category[]
}

export function CategorySection({ title, emptyMessage, categories }: Props) {
  const headingId = `categories-${title.toLowerCase()}`

  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <h2 id={headingId} className="text-lg font-semibold">
        {title}
      </h2>
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {categories.map((category) => (
            <CategoryItem key={category.id} category={category} />
          ))}
        </ul>
      )}
    </section>
  )
}
