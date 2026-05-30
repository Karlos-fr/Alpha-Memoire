/**
 * Moteur de progression des lettres.
 *
 * Les fonctions de ce fichier sont pures : elles reçoivent une progression de
 * lettre et renvoient une nouvelle progression sans modifier l'objet d'origine.
 */

import type { LetterProgress, LetterStatus } from '../../types'

/**
 * Contexte minimal d'un résultat d'exercice.
 */
export interface ProgressUpdateContext {
  occurredAt: string
  sessionId: string
}

/**
 * Marque une lettre comme simplement vue, sans réussite ni erreur.
 */
export function recordExposure(
  progress: LetterProgress,
  context: ProgressUpdateContext,
): LetterProgress {
  return applyProgressStatus(markSeen(progress, context.occurredAt))
}

/**
 * Met à jour une lettre après une bonne réponse autonome.
 */
export function recordSuccessWithoutHelp(
  progress: LetterProgress,
  context: ProgressUpdateContext,
): LetterProgress {
  return applyProgressStatus({
    ...markSeen(progress, context.occurredAt),
    successCount: progress.successCount + 1,
    successWithoutHelpCount: progress.successWithoutHelpCount + 1,
    currentStreak: progress.currentStreak + 1,
    successfulSessionIds: addSessionId(progress.successfulSessionIds, context.sessionId),
    lastSuccessAt: context.occurredAt,
  })
}

/**
 * Met à jour une lettre après une bonne réponse obtenue avec aide.
 */
export function recordSuccessWithHelp(
  progress: LetterProgress,
  context: ProgressUpdateContext,
): LetterProgress {
  return applyProgressStatus({
    ...markSeen(progress, context.occurredAt),
    successCount: progress.successCount + 1,
    helpCount: progress.helpCount + 1,
    successWithHelpCount: progress.successWithHelpCount + 1,
    currentStreak: 0,
    successfulSessionIds: addSessionId(progress.successfulSessionIds, context.sessionId),
    lastSuccessAt: context.occurredAt,
  })
}

/**
 * Met à jour une lettre après une erreur.
 */
export function recordError(
  progress: LetterProgress,
  context: ProgressUpdateContext,
): LetterProgress {
  return applyProgressStatus({
    ...markSeen(progress, context.occurredAt),
    errorCount: progress.errorCount + 1,
    currentStreak: 0,
    lastErrorAt: context.occurredAt,
  })
}

/**
 * Applique les règles de statut pédagogique.
 */
function applyProgressStatus(progress: LetterProgress): LetterProgress {
  return {
    ...progress,
    knownSessionCount: progress.successfulSessionIds.length,
    status: getNextStatus(progress),
  }
}

/**
 * Détermine le prochain statut d'une lettre.
 */
function getNextStatus(progress: LetterProgress): LetterStatus {
  if (isKnown(progress)) {
    return 'known'
  }

  if (isFragile(progress)) {
    return 'fragile'
  }

  if (progress.seenCount > 0 || progress.successCount > 0 || progress.errorCount > 0) {
    return 'learning'
  }

  return 'new'
}

/**
 * Déclare une lettre connue seulement après plusieurs réussites autonomes et
 * plusieurs séances.
 */
function isKnown(progress: LetterProgress): boolean {
  return (
    progress.successfulSessionIds.length >= 2 &&
    progress.successWithoutHelpCount >= 4 &&
    progress.currentStreak >= 3
  )
}

/**
 * Déclare une lettre fragile après erreurs ou aides répétées.
 */
function isFragile(progress: LetterProgress): boolean {
  return progress.errorCount >= 2 || progress.helpCount >= 2
}

/**
 * Marque une lettre comme vue à une date donnée.
 */
function markSeen(progress: LetterProgress, occurredAt: string): LetterProgress {
  return {
    ...progress,
    seenCount: progress.seenCount + 1,
    firstSeenAt: progress.firstSeenAt ?? occurredAt,
    lastSeenAt: occurredAt,
  }
}

/**
 * Ajoute une séance à la liste si elle n'est pas déjà présente.
 */
function addSessionId(sessionIds: string[], sessionId: string): string[] {
  if (sessionIds.includes(sessionId)) {
    return sessionIds
  }

  return [...sessionIds, sessionId]
}
