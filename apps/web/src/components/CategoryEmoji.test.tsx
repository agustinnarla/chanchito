import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CATEGORY_EMOJIS } from '@chanchito/core'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CategoryEmoji } from './CategoryEmoji'

// Vitest runs from apps/web.
const emojiDir = join(process.cwd(), 'public', 'emoji')

describe('CategoryEmoji', () => {
  it('shows the image of the key, hidden from screen readers', () => {
    const { container } = render(<CategoryEmoji emoji="shopping_cart" />)
    const img = container.querySelector('img')

    expect(img).toHaveAttribute('src', '/emoji/shopping_cart.webp')
    expect(img).toHaveAttribute('alt', '')
  })

  it('shows the default emoji for an unknown key', () => {
    const { container } = render(<CategoryEmoji emoji="rocket_from_the_future" />)

    expect(container.querySelector('img')).toHaveAttribute('src', '/emoji/package.webp')
  })

  it('has an image in public/emoji for every curated emoji', () => {
    const missing = CATEGORY_EMOJIS.filter(({ key }) => !existsSync(join(emojiDir, `${key}.webp`)))
    expect(missing).toEqual([])
  })
})
