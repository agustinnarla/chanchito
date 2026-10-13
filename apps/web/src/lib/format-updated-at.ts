import { formatDate, todayIso } from '@chanchito/core'

const time = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

/** When a rate was updated, in local time: "hoy a las 11:20", "ayer a las 18:00" or a date. */
export function formatUpdatedAt(at: string, now: Date = new Date()): string {
  const date = new Date(at)
  const day = todayIso(date)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (day === todayIso(now)) return `hoy a las ${time(date)}`
  if (day === todayIso(yesterday)) return `ayer a las ${time(date)}`
  return `el ${formatDate(day)} a las ${time(date)}`
}
