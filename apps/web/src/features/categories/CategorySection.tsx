import type { Category } from '@chanchito/core'
import { CategoryItem } from './CategoryItem'

type Props = {
  title: string
  description?: string
  emptyMessage: string
  categories: Category[]
  /** Show whether each category is income or expense (for mixed lists). */
  showKind?: boolean
}

export function CategorySection({
  title,
  description,
  emptyMessage,
  categories,
  showKind = false,
}: Props) {
  const headingId = `categories-${title.toLowerCase()}`

  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <h2 id={headingId} className="text-lg font-semibold">
        {title}
      </h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {categories.map((category) => (
            <CategoryItem key={category.id} category={category} showKind={showKind} />
          ))}
        </ul>
      )}
    </section>
  )
}
