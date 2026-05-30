/**
 * Tests unitaires du générateur de séance.
 *
 * Vérifie les contraintes de taille, de sélection de lettres et d'adaptation à
 * la progression avant l'interface enfant.
 */

import { describe, expect, it } from 'vitest'
import { createInitialProgress } from '../../src/lib/progressStorage'
import type { AppProgress, LetterProgress } from '../../src/types'
import { generateSessionPlan } from '../../src/features/session/sessionGenerator'

/**
 * Date stable utilisée pour générer les plans en test.
 */
const NOW = '2026-05-30T12:00:00.000Z'

/**
 * Générateur aléatoire stable pour des tests reproductibles.
 */
function stableRandom() {
  return 0.4
}

/**
 * Remplace la progression d'une lettre dans l'état global.
 */
function withLetter(
  progress: AppProgress,
  letter: string,
  overrides: Partial<LetterProgress>,
) {
  return {
    ...progress,
    letters: {
      ...progress.letters,
      [letter]: {
        ...progress.letters[letter],
        ...overrides,
      },
    },
  }
}

describe('sessionGenerator', () => {
  it('generates a short session from the current active letters', () => {
    const plan = generateSessionPlan(createInitialProgress(NOW), {
      now: NOW,
      random: stableRandom,
    })

    expect(plan.exercises.length).toBeGreaterThanOrEqual(8)
    expect(plan.exercises.length).toBeLessThanOrEqual(10)
    expect(plan.exercises.length).toBeLessThanOrEqual(12)
    expect(plan.letters.length).toBeGreaterThanOrEqual(3)
    expect(plan.letters.length).toBeLessThanOrEqual(5)
    expect(plan.letters.every((letter) => ['N', 'A', 'T', 'H'].includes(letter))).toBe(true)
    expect(plan.introducedLetters).toEqual([])
  })

  it('starts with easy recognition exercises', () => {
    const plan = generateSessionPlan(createInitialProgress(NOW), {
      now: NOW,
      random: stableRandom,
    })

    expect(plan.exercises[0].type).toBe('recognition')
    expect(plan.exercises[1].type).toBe('recognition')
    expect(plan.exercises[0].choices.length).toBe(2)
  })

  it('prioritizes fragile letters in the generated exercises', () => {
    const baseProgress = createInitialProgress(NOW)
    const progress = withLetter(baseProgress, 'H', {
      status: 'fragile',
      errorCount: 3,
      helpCount: 1,
    })
    const plan = generateSessionPlan(progress, {
      now: NOW,
      random: stableRandom,
    })
    const hExercises = plan.exercises.filter((exercise) => exercise.letter === 'H')

    expect(plan.letters).toContain('H')
    expect(hExercises.length).toBeGreaterThanOrEqual(3)
  })

  it('does not introduce a new letter when a fragile letter exists', () => {
    const baseProgress = createInitialProgress(NOW)
    const progress = withLetter(baseProgress, 'H', {
      status: 'fragile',
      errorCount: 2,
    })
    const plan = generateSessionPlan(progress, {
      now: NOW,
      random: stableRandom,
    })

    expect(plan.introducedLetters).toEqual([])
    expect(plan.letters.every((letter) => baseProgress.activeLetters.includes(letter))).toBe(true)
  })

  it('introduces at most one new letter when the active group is stable', () => {
    const baseProgress = createInitialProgress(NOW)
    const stableProgress = baseProgress.activeLetters.reduce(
      (progress, letter) =>
        withLetter(progress, letter, {
          status: 'known',
          successWithoutHelpCount: 5,
          currentStreak: 4,
          lastSeenAt: '2026-05-20T12:00:00.000Z',
        }),
      baseProgress,
    )
    const plan = generateSessionPlan(stableProgress, {
      now: NOW,
      random: stableRandom,
    })

    expect(plan.introducedLetters.length).toBeLessThanOrEqual(1)
    expect(plan.letters.length).toBeLessThanOrEqual(5)
  })

  it('uses association prompts with the letter card audio text', () => {
    const baseProgress = createInitialProgress(NOW)
    const progress = withLetter(baseProgress, 'N', {
      status: 'learning',
      seenCount: 1,
    })
    const plan = generateSessionPlan(progress, {
      now: NOW,
      random: stableRandom,
    })
    const association = plan.exercises.find((exercise) => exercise.type === 'association')

    expect(association?.prompt).toBe('N comme Nathan')
  })
})
