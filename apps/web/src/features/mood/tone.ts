import type { BudgetStatus, DayPart, MonthMood } from '@chanchito/core'
import type { IconName } from '@/components/icons'

/** The color family of a mood or a budget status (`data-tone`, see index.css). */
export type Tone = 'good' | 'warn' | 'bad' | 'neutral'

const MOOD_FILES = `${import.meta.env.BASE_URL}mood/`

type MoodLook = {
  tone: Tone
  /** The chip next to "Resultado del mes"; none when there is no mood to tell. */
  chip: { label: string; icon: IconName } | null
  /** The emoji next to the mascot. */
  badge: string | null
}

const LOOKS: Record<MonthMood['kind'], MoodLook> = {
  empty: { tone: 'neutral', chip: null, badge: `${MOOD_FILES}seedling.webp` },
  quiet: { tone: 'neutral', chip: null, badge: null },
  good: {
    tone: 'good',
    chip: { label: 'Vas bien', icon: 'trending_up' },
    badge: `${MOOD_FILES}sparkles.webp`,
  },
  warning: {
    tone: 'warn',
    chip: { label: 'Ajustado', icon: 'visibility' },
    badge: `${MOOD_FILES}face_with_peeking_eye.webp`,
  },
  exceeded: {
    tone: 'bad',
    chip: { label: 'Te pasaste', icon: 'trending_down' },
    badge: `${MOOD_FILES}sweat_droplets.webp`,
  },
  negative: {
    tone: 'bad',
    chip: { label: 'Te pasaste', icon: 'trending_down' },
    badge: `${MOOD_FILES}sweat_droplets.webp`,
  },
}

export function moodLook(mood: MonthMood): MoodLook {
  return LOOKS[mood.kind]
}

export const BUDGET_TONE: Record<BudgetStatus, Tone> = {
  ok: 'good',
  warning: 'warn',
  exceeded: 'bad',
}

/** The emoji next to the greeting: sunrise, sun or moon. */
export const DAY_PART_EMOJI: Record<DayPart, string> = {
  morning: `${MOOD_FILES}sunrise.webp`,
  afternoon: `${MOOD_FILES}sun.webp`,
  night: `${MOOD_FILES}crescent_moon.webp`,
}
