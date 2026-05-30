/**
 * Configuration applicative centrale d'Alpha-Mémoire.
 *
 * Les valeurs partagées par l'interface, le moteur de séance et le stockage
 * sont regroupées ici pour éviter les constantes dispersées.
 */

/**
 * Prénom utilisé dans les consignes et encouragements.
 */
export const CHILD_NAME = 'Nathan'

/**
 * Premier groupe de lettres travaillé au démarrage de la V1.
 */
export const INITIAL_ACTIVE_LETTERS = ['N', 'A', 'T', 'H'] as const

/**
 * Nombre d'exercices attendus pour une séance courte.
 */
export const SESSION_EXERCISE_COUNT = {
  targetMin: 8,
  targetMax: 10,
  hardMax: 12,
} as const

/**
 * Durée pédagogique cible d'une séance, en minutes.
 */
export const SESSION_DURATION_MINUTES = {
  min: 5,
  max: 10,
} as const

/**
 * Version du format de sauvegarde de la progression.
 */
export const APP_PROGRESS_VERSION = 1
