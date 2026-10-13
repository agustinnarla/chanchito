import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

gsap.registerPlugin(useGSAP)

/** Close to Material 3's curves (spec 007): emphasized for entrances, standard for changes. */
export const EASE = { emphasized: 'expo.out', standard: 'power2.inOut', pop: 'back.out(2.5)' }

/** In seconds, as GSAP takes them. */
export const DURATION = { short: 0.2, medium: 0.4, long: 0.7 }

/** Lists stagger their first items only; the rest come in with the last of them. */
export const MAX_STAGGERED = 8
const STAGGER_STEP = 0.04

export function staggerDelay(index: number): number {
  return Math.min(index, MAX_STAGGERED - 1) * STAGGER_STEP
}

/**
 * Whether to run GSAP animations: only when the person hasn't asked for reduced motion.
 * Without matchMedia (tests) they don't run, so everything shows its final state at once.
 */
export function shouldAnimate(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: no-preference)').matches ?? false
}

export { gsap, useGSAP }
