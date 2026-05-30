/**
 * Modèles d'apprentissage partagés par Alpha-Mémoire.
 *
 * Ces types décrivent les lettres, les exercices, les séances et la progression
 * persistée de Nathan.
 */

/**
 * État pédagogique courant d'une lettre dans la progression.
 */
export type LetterStatus = 'new' | 'learning' | 'fragile' | 'known'

/**
 * Type d'exercice proposé pendant une séance.
 */
export type ExerciseType =
  | 'discovery'
  | 'recognition'
  | 'choice'
  | 'association'
  | 'naming'

/**
 * Représentation normalisée d'une lettre manipulée par l'application.
 */
export type LetterSymbol = string

/**
 * Données statiques associées à une lettre affichée dans les exercices.
 */
export interface LetterCard {
  letter: LetterSymbol
  word: string
  audioText: string
  image: {
    src: string
    alt: string
  }
}

/**
 * Progression cumulée pour une lettre donnée.
 */
export interface LetterProgress {
  letter: LetterSymbol
  status: LetterStatus
  seenCount: number
  successCount: number
  errorCount: number
  helpCount: number
  successWithoutHelpCount: number
  successWithHelpCount: number
  currentStreak: number
  knownSessionCount: number
  firstSeenAt: string | null
  lastSeenAt: string | null
  lastSuccessAt: string | null
  lastErrorAt: string | null
}

/**
 * Résultat détaillé d'un exercice réalisé pendant une séance.
 */
export interface ExerciseResult {
  id: string
  type: ExerciseType
  letter: LetterSymbol
  choices: LetterSymbol[]
  success: boolean
  attempts: number
  helped: boolean
  parentValidated: boolean
  startedAt: string
  completedAt: string
}

/**
 * Enregistrement complet d'une séance terminée.
 */
export interface SessionRecord {
  id: string
  startedAt: string
  endedAt: string
  durationSeconds: number
  exercises: ExerciseResult[]
  summary: {
    successes: number
    errors: number
    helpedCount: number
    lettersPracticed: LetterSymbol[]
    fragileLetters: LetterSymbol[]
    knownLetters: LetterSymbol[]
  }
}

/**
 * État complet sauvegardé pour l'application.
 */
export interface AppProgress {
  version: number
  childName: string
  activeLetters: LetterSymbol[]
  letters: Record<LetterSymbol, LetterProgress>
  sessions: SessionRecord[]
  createdAt: string
  updatedAt: string
}
