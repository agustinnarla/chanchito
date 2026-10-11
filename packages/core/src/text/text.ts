/** Trims and collapses any run of whitespace into a single space. */
export function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

/** Counts code points like Postgres `char_length`, so an emoji counts as one character. */
export function characterCount(value: string): number {
  return [...value].length
}
