/**
 * Stockage local de la progression Alpha-Mémoire.
 *
 * Cette couche isole `localStorage` du reste de l'application et fournit les
 * fonctions d'import/export JSON utilisées plus tard par l'espace parent.
 */

import { LETTER_ALPHABET } from '../data/letters'
import type { AppProgress, LetterProgress, LetterSymbol, SessionRecord } from '../types'
import {
  APP_PROGRESS_VERSION,
  CHILD_NAME,
  INITIAL_ACTIVE_LETTERS,
  PROGRESS_STORAGE_KEY,
} from './appConfig'

/**
 * Crée l'état initial d'une lettre jamais travaillée.
 */
export function createInitialLetterProgress(letter: LetterSymbol): LetterProgress {
  return {
    letter,
    status: 'new',
    seenCount: 0,
    successCount: 0,
    errorCount: 0,
    helpCount: 0,
    successWithoutHelpCount: 0,
    successWithHelpCount: 0,
    currentStreak: 0,
    knownSessionCount: 0,
    successfulSessionIds: [],
    firstSeenAt: null,
    lastSeenAt: null,
    lastSuccessAt: null,
    lastErrorAt: null,
  }
}

/**
 * Crée une progression complète prête à être sauvegardée.
 */
export function createInitialProgress(now = new Date().toISOString()): AppProgress {
  const letters = Object.fromEntries(
    LETTER_ALPHABET.map((letter) => [letter, createInitialLetterProgress(letter)]),
  ) as Record<LetterSymbol, LetterProgress>

  return {
    version: APP_PROGRESS_VERSION,
    childName: CHILD_NAME,
    activeLetters: [...INITIAL_ACTIVE_LETTERS],
    letters,
    sessions: [],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Charge la progression sauvegardée, ou `null` si aucune donnée valide n'existe.
 */
export function loadProgress(): AppProgress | null {
  const storage = getLocalStorage()

  if (!storage) {
    return null
  }

  const storedValue = storage.getItem(PROGRESS_STORAGE_KEY)

  if (!storedValue) {
    return null
  }

  try {
    return parseProgressJson(storedValue)
  } catch {
    return null
  }
}

/**
 * Sauvegarde la progression dans le navigateur.
 */
export function saveProgress(progress: AppProgress): AppProgress {
  const storage = getLocalStorage()
  const nextProgress = {
    ...progress,
    updatedAt: new Date().toISOString(),
  }

  if (storage) {
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(nextProgress))
  }

  return nextProgress
}

/**
 * Charge la progression existante ou initialise automatiquement une sauvegarde.
 */
export function ensureStoredProgress(): AppProgress {
  const existingProgress = loadProgress()

  if (existingProgress) {
    return existingProgress
  }

  return saveProgress(createInitialProgress())
}

/**
 * Ajoute une séance terminée à l'historique puis sauvegarde la progression.
 */
export function saveSession(progress: AppProgress, session: SessionRecord): AppProgress {
  return saveProgress({
    ...progress,
    sessions: [...progress.sessions, session],
  })
}

/**
 * Sérialise la progression pour téléchargement ou sauvegarde manuelle.
 */
export function exportProgressToJson(progress: AppProgress): string {
  return JSON.stringify(progress, null, 2)
}

/**
 * Importe une progression depuis une chaîne JSON et la sauvegarde.
 */
export function importProgressFromJson(json: string): AppProgress {
  return saveProgress(parseProgressJson(json))
}

/**
 * Parse et valide minimalement une sauvegarde JSON.
 */
export function parseProgressJson(json: string): AppProgress {
  const value: unknown = JSON.parse(json)

  if (!isAppProgress(value)) {
    throw new Error("Le fichier JSON ne contient pas une progression Alpha-Mémoire valide.")
  }

  return value
}

/**
 * Vérifie si une valeur ressemble au format de progression attendu.
 */
function isAppProgress(value: unknown): value is AppProgress {
  if (!isRecord(value)) {
    return false
  }

  return (
    value.version === APP_PROGRESS_VERSION &&
    typeof value.childName === 'string' &&
    Array.isArray(value.activeLetters) &&
    isRecord(value.letters) &&
    Array.isArray(value.sessions) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  )
}

/**
 * Vérifie qu'une valeur est un objet indexable.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Récupère localStorage seulement lorsqu'il est disponible.
 */
function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}
