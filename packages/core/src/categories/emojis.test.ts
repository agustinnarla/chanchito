import { describe, expect, it } from 'vitest'
import {
  CATEGORY_EMOJIS,
  CategoryEmojiSchema,
  DEFAULT_CATEGORY_EMOJI,
  categoryEmojiLabel,
  resolveCategoryEmoji,
} from './emojis'
import { SUGGESTED_CATEGORIES } from './suggested'

describe('CATEGORY_EMOJIS', () => {
  it('has unique keys in the format the database accepts', () => {
    const keys = CATEGORY_EMOJIS.map((e) => e.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const key of keys) expect(key).toMatch(/^[a-z0-9_]{1,40}$/)
  })

  it('has between 40 and 60 emojis, each with a label in Spanish', () => {
    expect(CATEGORY_EMOJIS.length).toBeGreaterThanOrEqual(40)
    expect(CATEGORY_EMOJIS.length).toBeLessThanOrEqual(60)
    for (const emoji of CATEGORY_EMOJIS) expect(emoji.label.length).toBeGreaterThan(0)
  })

  it('includes the default one', () => {
    expect(CATEGORY_EMOJIS.map((e) => e.key)).toContain(DEFAULT_CATEGORY_EMOJI)
  })

  it('covers every suggested category', () => {
    for (const category of SUGGESTED_CATEGORIES) {
      expect(resolveCategoryEmoji(category.emoji)).toBe(category.emoji)
    }
  })
})

describe('resolveCategoryEmoji', () => {
  it('keeps a known key', () => {
    expect(resolveCategoryEmoji('shopping_cart')).toBe('shopping_cart')
  })

  it.each([undefined, null, '', 'rocket_from_the_future'])(
    'falls back to the default for %j',
    (key) => {
      expect(resolveCategoryEmoji(key)).toBe(DEFAULT_CATEGORY_EMOJI)
    },
  )
})

describe('categoryEmojiLabel', () => {
  it('returns the Spanish label, or the default one for unknown keys', () => {
    expect(categoryEmojiLabel('shopping_cart')).toBe('Carrito de compras')
    expect(categoryEmojiLabel('nope')).toBe(categoryEmojiLabel(DEFAULT_CATEGORY_EMOJI))
  })
})

describe('CategoryEmojiSchema', () => {
  it('accepts only keys from the list, with a message in Spanish', () => {
    expect(CategoryEmojiSchema.safeParse('house').success).toBe(true)
    const result = CategoryEmojiSchema.safeParse('rocket')
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Elegí un emoji de la lista.')
  })
})
