/**
 * Fixes "today" for a test. Only `Date` is faked: React Query, navigation and Testing Library keep
 * their real timers, which stay reliable on slow machines like the CI's.
 */
export function setToday(date: Date) {
  jest.useFakeTimers({
    now: date,
    doNotFake: [
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  })
}
