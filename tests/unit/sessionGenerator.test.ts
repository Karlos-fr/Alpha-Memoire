/**
 * Tests unitaires du générateur de séance.
 *
 * Vérifie les contraintes de taille, de sélection de lettres et d'adaptation à
 * la progression avant l'interface enfant.
 */

import { describe, expect, it } from 'vitest'
import { createInitialProgress } from '../../src/lib/progressStorage'
import type { AppProgress, LetterProgress, SessionRecord } from '../../src/types'
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

/**
 * Ajoute une seance terminee a l'historique de test.
 */
function withSession(progress: AppProgress, session: SessionRecord) {
  return {
    ...progress,
    sessions: [...progress.sessions, session],
  }
}

/**
 * Cree une seance de test centree sur une lettre.
 */
function createSession(letter: string, overrides: Partial<SessionRecord['exercises'][number]>) {
  return {
    id: `session-${letter}`,
    startedAt: '2026-05-29T12:00:00.000Z',
    endedAt: '2026-05-29T12:05:00.000Z',
    durationSeconds: 300,
    exercises: [
      {
        id: `exercise-${letter}`,
        type: 'choice',
        letter,
        choices: [letter, 'N', 'A'],
        scored: true,
        success: true,
        attempts: 1,
        helped: false,
        parentValidated: false,
        startedAt: '2026-05-29T12:00:00.000Z',
        completedAt: '2026-05-29T12:00:30.000Z',
        ...overrides,
      },
    ],
    summary: {
      successes: 1,
      errors: 0,
      helpedCount: overrides.helped ? 1 : 0,
      lettersPracticed: [letter],
      fragileLetters: [],
      knownLetters: [],
    },
  } satisfies SessionRecord
}

describe('sessionGenerator', () => {
  it('generates a short session from the current active letters', () => {
    const plan = generateSessionPlan(createInitialProgress(NOW), {
      now: NOW,
      random: stableRandom,
    })

    expect(plan.exercises.length).toBeGreaterThanOrEqual(8)
    expect(plan.exercises.length).toBeLessThanOrEqual(10)
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

  it('introduces one new letter after three recent clean sessions', () => {
    const baseProgress = createInitialProgress(NOW)
    const cleanProgress = ['N', 'A', 'T'].reduce(
      (progress, letter, index) =>
        withSession(
          progress,
          createSession(letter, {
            id: `clean-exercise-${index + 1}`,
            helped: false,
            attempts: 1,
            success: true,
          }),
        ),
      baseProgress,
    )
    const plan = generateSessionPlan(cleanProgress, {
      now: NOW,
      random: stableRandom,
    })

    expect(plan.introducedLetters.length).toBe(1)
    expect(baseProgress.activeLetters).not.toContain(plan.introducedLetters[0])
    expect(plan.exercises.length).toBeGreaterThan(10)
    expect(plan.letters.every((letter) =>
      plan.exercises.some((exercise) => exercise.letter === letter),
    )).toBe(true)
  })

  it('covers every acquired or learning letter without a hard session cap', () => {
    const baseProgress = createInitialProgress(NOW)
    const progress = ['N', 'A', 'T', 'H', 'B', 'C', 'D', 'E'].reduce(
      (currentProgress, letter) =>
        withLetter(currentProgress, letter, {
          status: letter === 'N' || letter === 'A' ? 'known' : 'learning',
          seenCount: 2,
          successWithoutHelpCount: letter === 'N' || letter === 'A' ? 4 : 1,
          currentStreak: letter === 'N' || letter === 'A' ? 4 : 1,
          knownSessionCount: letter === 'N' || letter === 'A' ? 2 : 0,
        }),
      baseProgress,
    )
    const plan = generateSessionPlan(progress, {
      now: NOW,
      random: stableRandom,
    })

    expect(plan.letters).toEqual(expect.arrayContaining(['N', 'A', 'T', 'H', 'B', 'C', 'D', 'E']))
    expect(plan.exercises.length).toBeGreaterThan(14)
    expect(plan.letters.every((letter) =>
      plan.exercises.some((exercise) => exercise.letter === letter),
    )).toBe(true)
  })

  it('uses association prompts with the letter card audio text', () => {
    const baseProgress = createInitialProgress(NOW)
    const progress = baseProgress.activeLetters.reduce(
      (currentProgress, letter) =>
        withLetter(currentProgress, letter, {
          status: 'learning',
          seenCount: 1,
        }),
      baseProgress,
    )
    const plan = generateSessionPlan(progress, {
      now: NOW,
      random: stableRandom,
    })
    const association = plan.exercises.find((exercise) => exercise.type === 'association')

    expect(association?.prompt).toMatch(/^[A-Z] comme /)
  })

  it('uses recent session history to increase a helped letter frequency', () => {
    const baseProgress = createInitialProgress(NOW)
    const progress = withSession(
      withLetter(baseProgress, 'H', {
        status: 'learning',
        seenCount: 2,
        helpCount: 1,
      }),
      createSession('H', {
        helped: true,
        attempts: 2,
      }),
    )
    const plan = generateSessionPlan(progress, {
      now: NOW,
      random: stableRandom,
    })
    const hExercises = plan.exercises.filter((exercise) => exercise.letter === 'H')

    expect(plan.letters).toContain('H')
    expect(hExercises.length).toBeGreaterThanOrEqual(4)
    expect(hExercises.some((exercise) => exercise.type === 'association')).toBe(true)
  })

  it('reviews a known letter that has not been seen for several days', () => {
    const progress = withLetter(createInitialProgress(NOW), 'N', {
      status: 'known',
      successWithoutHelpCount: 4,
      currentStreak: 4,
      knownSessionCount: 2,
      lastSeenAt: '2026-05-20T12:00:00.000Z',
    })
    const plan = generateSessionPlan(progress, {
      now: NOW,
      random: stableRandom,
    })

    expect(plan.letters).toContain('N')
  })

  it('does not propose naming before recognition is stable across sessions', () => {
    const stableInOneSession = createInitialProgress(NOW).activeLetters.reduce(
      (progress, letter) =>
        withLetter(progress, letter, {
          status: 'known',
          successWithoutHelpCount: 5,
          currentStreak: 4,
          knownSessionCount: 1,
          lastSeenAt: '2026-05-30T11:00:00.000Z',
        }),
      createInitialProgress(NOW),
    )
    const plan = generateSessionPlan(stableInOneSession, {
      now: NOW,
      random: stableRandom,
    })

    expect(plan.exercises.some((exercise) => exercise.type === 'naming')).toBe(false)
  })

  it('reduces repetition for a stable known letter compared with a recent problem', () => {
    const baseProgress = createInitialProgress(NOW)
    const stableProgress = withLetter(baseProgress, 'N', {
      status: 'known',
      successWithoutHelpCount: 6,
      currentStreak: 6,
      knownSessionCount: 3,
      lastSeenAt: '2026-05-30T11:00:00.000Z',
    })
    const progress = withSession(
      withLetter(stableProgress, 'H', {
        status: 'learning',
        helpCount: 1,
      }),
      createSession('H', {
        helped: true,
        attempts: 2,
      }),
    )
    const plan = generateSessionPlan(progress, {
      now: NOW,
      random: stableRandom,
    })
    const nCount = plan.exercises.filter((exercise) => exercise.letter === 'N').length
    const hCount = plan.exercises.filter((exercise) => exercise.letter === 'H').length

    expect(hCount).toBeGreaterThan(nCount)
  })
})
