import {
  dayPart,
  greeting,
  moodMessage,
  todayIso,
  type Month,
  type MonthMood,
} from '@chanchito/core'
import { cn } from '@/lib/utils'
import { DAY_PART_EMOJI, moodLook } from './tone'

const MASCOT = `${import.meta.env.BASE_URL}brand/chanchito-grande.webp`

type Props = { mood: MonthMood; month: Month; now?: Date }

/**
 * The mascot (spec 008): the chanchito on a slowly turning shape tinted by the month's mood, its
 * mood's emoji, the greeting for the time of day and a sentence about the month.
 */
export function MoodGreeting({ mood, month, now = new Date() }: Props) {
  const { tone, badge } = moodLook(mood)
  const part = dayPart(now)

  return (
    <section
      aria-label="Cómo viene el mes"
      className="flex items-center gap-4 px-1 py-1 sm:gap-5 sm:px-2"
    >
      <span data-tone={tone} className="relative size-20 shrink-0 sm:size-24">
        <span
          aria-hidden="true"
          className="shape shape-sunny absolute inset-0 animate-spin-slow bg-tone-glow motion-reduce:animate-none"
        />
        <img
          src={MASCOT}
          alt=""
          className="absolute inset-[15%] size-[70%] animate-bob motion-reduce:animate-none"
        />
        {badge && (
          // Keyed by mood so a new mood's emoji pops in
          <img
            key={mood.kind}
            src={badge}
            alt=""
            className={cn(
              'absolute -right-1.5 -bottom-1 size-8 sm:size-9',
              'duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] animate-in fade-in zoom-in-50',
            )}
          />
        )}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[15px] text-muted-foreground">
          <img src={DAY_PART_EMOJI[part]} alt="" className="size-5" />
          {greeting(part)}
        </p>
        <p
          aria-live="polite"
          className="mt-1 text-xl leading-snug font-semibold text-balance sm:text-2xl"
        >
          {moodMessage(mood, { month, today: todayIso(now) })}
        </p>
      </div>
    </section>
  )
}
