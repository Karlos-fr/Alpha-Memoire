/**
 * Tests unitaires du moteur de progression.
 *
 * Ces tests protègent les règles pédagogiques de base avant de brancher le
 * générateur de séance et l'interface enfant.
 */

import { describe, expect, it } from 'vitest'
import { createInitialLetterProgress } from '../../src/lib/progressStorage'
import type { LetterProgress } from '../../src/types'
import {
  recordError,
  recordExposure,
  recordSuccessWithHelp,
  recordSuccessWithoutHelp,
} from '../../src/features/progress/progressEngine'

/**
 * Crée une progression neuve de test.
 */
function createProgress() {
  return createInitialLetterProgress('N')
}

/**
 * Applique plusieurs réussites autonomes au même contexte.
 */
function repeatSuccesses(
  progress: LetterProgress,
  count: number,
  context: { occurredAt: string; sessionId: string },
) {
  return Array.from({ length: count }).reduce<LetterProgress>(
    (currentProgress) => recordSuccessWithoutHelp(currentProgress, context),
    progress,
  )
}

describe('progressEngine', () => {
  it('records an exposure without counting success or error', () => {
    const progress = recordExposure(createProgress(), {
      occurredAt: '2026-05-30T09:59:00.000Z',
      sessionId: 'session-1',
    })

    expect(progress.status).toBe('learning')
    expect(progress.seenCount).toBe(1)
    expect(progress.successCount).toBe(0)
    expect(progress.errorCount).toBe(0)
    expect(progress.currentStreak).toBe(0)
    expect(progress.lastSeenAt).toBe('2026-05-30T09:59:00.000Z')
  })

  it('records an autonomous success and moves a new letter to learning', () => {
    const progress = recordSuccessWithoutHelp(createProgress(), {
      occurredAt: '2026-05-30T10:00:00.000Z',
      sessionId: 'session-1',
    })

    expect(progress.status).toBe('learning')
    expect(progress.seenCount).toBe(1)
    expect(progress.successCount).toBe(1)
    expect(progress.successWithoutHelpCount).toBe(1)
    expect(progress.currentStreak).toBe(1)
    expect(progress.firstSeenAt).toBe('2026-05-30T10:00:00.000Z')
    expect(progress.lastSeenAt).toBe('2026-05-30T10:00:00.000Z')
    expect(progress.lastSuccessAt).toBe('2026-05-30T10:00:00.000Z')
  })

  it('records a helped success without increasing the autonomous streak', () => {
    const progress = recordSuccessWithHelp(createProgress(), {
      occurredAt: '2026-05-30T10:01:00.000Z',
      sessionId: 'session-1',
    })

    expect(progress.status).toBe('learning')
    expect(progress.successCount).toBe(1)
    expect(progress.helpCount).toBe(1)
    expect(progress.successWithHelpCount).toBe(1)
    expect(progress.currentStreak).toBe(0)
  })

  it('marks a letter as fragile after repeated errors', () => {
    const firstError = recordError(createProgress(), {
      occurredAt: '2026-05-30T10:02:00.000Z',
      sessionId: 'session-1',
    })
    const secondError = recordError(firstError, {
      occurredAt: '2026-05-30T10:03:00.000Z',
      sessionId: 'session-1',
    })

    expect(secondError.status).toBe('fragile')
    expect(secondError.errorCount).toBe(2)
    expect(secondError.currentStreak).toBe(0)
    expect(secondError.lastErrorAt).toBe('2026-05-30T10:03:00.000Z')
  })

  it('does not mark a letter as known after successes in only one session', () => {
    const progress = repeatSuccesses(createProgress(), 4, {
      occurredAt: '2026-05-30T10:04:00.000Z',
      sessionId: 'session-1',
    })

    expect(progress.status).toBe('learning')
    expect(progress.successWithoutHelpCount).toBe(4)
    expect(progress.knownSessionCount).toBe(1)
  })

  it('marks a letter as known after autonomous successes across sessions', () => {
    const afterSessionOne = repeatSuccesses(createProgress(), 2, {
      occurredAt: '2026-05-30T10:05:00.000Z',
      sessionId: 'session-1',
    })
    const afterSessionTwo = repeatSuccesses(afterSessionOne, 2, {
      occurredAt: '2026-05-31T10:05:00.000Z',
      sessionId: 'session-2',
    })

    expect(afterSessionTwo.status).toBe('known')
    expect(afterSessionTwo.successWithoutHelpCount).toBe(4)
    expect(afterSessionTwo.currentStreak).toBe(4)
    expect(afterSessionTwo.knownSessionCount).toBe(2)
  })
})
