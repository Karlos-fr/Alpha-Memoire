/**
 * Générateur adaptatif de séances.
 *
 * Construit un plan de séance court à partir de la progression sauvegardée, en
 * privilégiant les lettres fragiles et en limitant les nouveautés.
 */

import { getLetterCard } from '../../data/letters'
import { SESSION_EXERCISE_COUNT } from '../../lib/appConfig'
import type {
  AppProgress,
  ExerciseType,
  LetterProgress,
  LetterStatus,
  LetterSymbol,
  PlannedExercise,
  SessionPlan,
} from '../../types'

/**
 * Options permettant de rendre la génération testable.
 */
export interface GenerateSessionPlanOptions {
  now?: string
  random?: () => number
}

/**
 * MÃ©moire rÃ©cente utilisÃ©e pour adapter la sÃ©ance suivante.
 */
interface SessionAdaptationContext {
  now: string
  recentProblemLetters: LetterSymbol[]
  stableLetters: LetterSymbol[]
  dueReviewLetters: LetterSymbol[]
}

/**
 * Groupes de lettres classés par statut pédagogique.
 */
interface LetterGroups {
  fragile: LetterProgress[]
  learning: LetterProgress[]
  known: LetterProgress[]
  newLetters: LetterProgress[]
}

/**
 * Crée un plan de séance adapté à la progression courante.
 */
export function generateSessionPlan(
  progress: AppProgress,
  options: GenerateSessionPlanOptions = {},
): SessionPlan {
  const random = options.random ?? Math.random
  const createdAt = options.now ?? new Date().toISOString()
  const context = createSessionAdaptationContext(progress, createdAt)
  const activeLetters = selectActiveLetters(progress, random, context)
  const exercises = buildExercises(progress, activeLetters, random, context)

  return {
    id: `session-plan-${createdAt}`,
    exercises,
    letters: uniqueLetters(exercises.map((exercise) => exercise.letter)),
    introducedLetters: activeLetters.filter(
      (letter) => !progress.activeLetters.includes(letter),
    ),
    createdAt,
  }
}

/**
 * Sélectionne 3 à 5 lettres différentes pour la séance.
 */
function selectActiveLetters(
  progress: AppProgress,
  random: () => number,
  context: SessionAdaptationContext,
): LetterSymbol[] {
  const groups = groupLetters(progress)
  const selectedLetters: LetterSymbol[] = []
  const requiredLetters = getRequiredSessionLetters(progress)
  const requiredLearningLetters = requiredLetters.filter(
    (letterProgress) => letterProgress.status !== 'known',
  )
  const requiredKnownLetters = requiredLetters.filter(
    (letterProgress) => letterProgress.status === 'known',
  )

  addLetters(selectedLetters, context.recentProblemLetters, Number.POSITIVE_INFINITY)
  addLetters(selectedLetters, sortByPriority(groups.fragile), Number.POSITIVE_INFINITY)
  addLetters(selectedLetters, shuffle(requiredLearningLetters, random), Number.POSITIVE_INFINITY)
  addLetters(selectedLetters, context.dueReviewLetters, Number.POSITIVE_INFINITY)
  addLetters(
    selectedLetters,
    getKnownLettersToReview(requiredKnownLetters),
    Number.POSITIVE_INFINITY,
  )

  if (canIntroduceNewLetter(progress, groups)) {
    addLetters(selectedLetters, groups.newLetters, selectedLetters.length + 1)
  }

  addLetters(selectedLetters, shuffle(requiredLetters, random), Number.POSITIVE_INFINITY)
  addLetters(selectedLetters, getFallbackLetters(progress), Number.POSITIVE_INFINITY)

  return selectedLetters
}

/**
 * Construit les exercices dans l'ordre pédagogique de la séance.
 */
function buildExercises(
  progress: AppProgress,
  letters: LetterSymbol[],
  random: () => number,
  context: SessionAdaptationContext,
): PlannedExercise[] {
  const targetCount = getTargetExerciseCount(random, letters.length)
  const exercises: PlannedExercise[] = []
  const easyLetters = getEasyStartLetters(progress, letters)
  const weightedLetters = getWeightedLetters(progress, letters, context)

  easyLetters.slice(0, 2).forEach((letter, index) => {
    exercises.push(createPlannedExercise(index, 'twoChoice', letter, letters, random))
  })

  letters
    .filter((letter) => !exercises.some((exercise) => exercise.letter === letter))
    .forEach((letter) => {
      if (exercises.length < targetCount) {
        const type = getExerciseType(progress.letters[letter], exercises.length, context)
        exercises.push(createPlannedExercise(exercises.length, type, letter, letters, random))
      }
    })

  const namingLetter = letters.find((letter) =>
    isReadyForNaming(progress.letters[letter], context),
  )

  if (
    namingLetter &&
    exercises.length < targetCount &&
    !exercises.some((exercise) => exercise.type === 'naming')
  ) {
    exercises.push(createPlannedExercise(exercises.length, 'naming', namingLetter, letters, random))
  }

  while (exercises.length < targetCount) {
    const letter = weightedLetters[exercises.length % weightedLetters.length]
    const type = getExerciseType(progress.letters[letter], exercises.length, context)
    exercises.push(createPlannedExercise(exercises.length, type, letter, letters, random))
  }

  return exercises
}

/**
 * Crée un exercice planifié.
 */
function createPlannedExercise(
  index: number,
  type: ExerciseType,
  letter: LetterSymbol,
  sessionLetters: LetterSymbol[],
  random: () => number,
): PlannedExercise {
  const choices = getChoices(type, letter, sessionLetters, random)

  return {
    id: `exercise-${index + 1}`,
    type,
    letter,
    choices,
    prompt: getPrompt(type, letter),
  }
}

/**
 * Classe les lettres de la progression par statut.
 */
function groupLetters(progress: AppProgress): LetterGroups {
  const allLetters = Object.values(progress.letters)

  return {
    fragile: filterByStatus(allLetters, 'fragile'),
    learning: allLetters.filter((letter) => letter.status === 'learning' || letter.status === 'new'),
    known: filterByStatus(allLetters, 'known'),
    newLetters: allLetters.filter(
      (letter) => letter.status === 'new' && !progress.activeLetters.includes(letter.letter),
    ),
  }
}

/**
 * Renvoie toutes les lettres a couvrir : groupe actif initial, lettres connues,
 * lettres fragiles et lettres deja entrees en apprentissage.
 */
function getRequiredSessionLetters(progress: AppProgress) {
  return Object.values(progress.letters).filter((letterProgress) => {
    return (
      progress.activeLetters.includes(letterProgress.letter) ||
      letterProgress.status === 'learning' ||
      letterProgress.status === 'fragile' ||
      letterProgress.status === 'known'
    )
  })
}

/**
 * Filtre les lettres selon un statut exact.
 */
function filterByStatus(letters: LetterProgress[], status: LetterStatus) {
  return letters.filter((letter) => letter.status === status)
}

/**
 * Indique si une nouvelle lettre hors groupe actif peut entrer dans la séance.
 */
function canIntroduceNewLetter(
  progress: AppProgress,
  groups: LetterGroups,
) {
  const unstableActiveLetterCount = progress.activeLetters.filter((letter) => {
    return progress.letters[letter]?.status !== 'known'
  }).length

  return (
    groups.fragile.length === 0 &&
    (unstableActiveLetterCount <= 1 || hasRecentCleanSessions(progress, 3)) &&
    groups.newLetters.length > 0
  )
}

/**
 * Autorise une progression douce après plusieurs séances récentes sans erreur ni aide.
 */
function hasRecentCleanSessions(progress: AppProgress, sessionCount: number) {
  const recentSessions = progress.sessions.slice(-sessionCount)

  return (
    recentSessions.length >= sessionCount &&
    recentSessions.every((session) =>
      session.exercises.every((exercise) => {
        if (!exercise.scored) {
          return true
        }

        return exercise.success && !exercise.helped && exercise.attempts === 1
      }),
    )
  )
}

/**
 * Trie les lettres les plus fragiles en premier.
 */
function sortByPriority(letters: LetterProgress[]) {
  return [...letters].sort((left, right) => {
    const rightScore = right.errorCount * 2 + right.helpCount
    const leftScore = left.errorCount * 2 + left.helpCount
    return rightScore - leftScore
  })
}

/**
 * Sélectionne les lettres connues à revoir.
 */
function getKnownLettersToReview(letters: LetterProgress[]) {
  return [...letters].sort((left, right) =>
    getDateValue(left.lastSeenAt) - getDateValue(right.lastSeenAt),
  )
}

/**
 * Renvoie les lettres du groupe actif comme solution de repli.
 */
function getFallbackLetters(progress: AppProgress) {
  return progress.activeLetters
    .map((letter) => progress.letters[letter])
    .filter((letter): letter is LetterProgress => Boolean(letter))
}

/**
 * Sélectionne les lettres de démarrage facile.
 */
function getEasyStartLetters(progress: AppProgress, letters: LetterSymbol[]) {
  const sortedLetters = [...letters].sort((left, right) => {
    const leftProgress = progress.letters[left]
    const rightProgress = progress.letters[right]

    return getDifficultyScore(leftProgress) - getDifficultyScore(rightProgress)
  })

  return sortedLetters.slice(0, 2)
}

/**
 * Crée une liste pondérée de lettres pour respecter la priorité adaptative.
 */
function getWeightedLetters(
  progress: AppProgress,
  letters: LetterSymbol[],
  context: SessionAdaptationContext,
) {
  const weightedLetters = letters.flatMap((letter) => {
    const status = progress.letters[letter]?.status

    if (context.recentProblemLetters.includes(letter)) {
      return [letter, letter, letter, letter, letter, letter, letter]
    }

    if (context.stableLetters.includes(letter) && !context.dueReviewLetters.includes(letter)) {
      return [letter]
    }

    if (context.dueReviewLetters.includes(letter)) {
      return [letter, letter]
    }

    if (status === 'fragile') {
      return [letter, letter, letter, letter, letter, letter]
    }

    if (status === 'known') {
      return [letter]
    }

    return [letter, letter, letter]
  })

  return weightedLetters.length > 0 ? weightedLetters : letters
}

/**
 * Détermine le type d'exercice à générer.
 */
function getExerciseType(
  progress: LetterProgress | undefined,
  index: number,
  context: SessionAdaptationContext,
): ExerciseType {
  if (!progress || progress.status === 'new') {
    return index % 2 === 0 ? 'association' : 'twoChoice'
  }

  if (context.recentProblemLetters.includes(progress.letter)) {
    return index % 2 === 0 ? 'association' : 'twoChoice'
  }

  if (isReadyForNaming(progress, context)) {
    return index % 4 === 0 ? 'naming' : 'threeChoice'
  }

  if (progress.status === 'fragile') {
    return index % 3 === 0 ? 'association' : 'threeChoice'
  }

  return index % 3 === 0 ? 'association' : 'threeChoice'
}

/**
 * Construit les choix affichés pour un exercice.
 */
/**
 * Construit les signaux issus de l'historique des dernieres seances.
 */
function createSessionAdaptationContext(
  progress: AppProgress,
  now: string,
): SessionAdaptationContext {
  const recentProblemLetters = getRecentProblemLetters(progress)
  const stableLetters = Object.values(progress.letters)
    .filter((letterProgress) => isStableLetter(letterProgress, recentProblemLetters))
    .map((letterProgress) => letterProgress.letter)
  const dueReviewLetters = Object.values(progress.letters)
    .filter((letterProgress) => isDueForReview(letterProgress, now))
    .map((letterProgress) => letterProgress.letter)

  return {
    now,
    recentProblemLetters,
    stableLetters,
    dueReviewLetters,
  }
}

/**
 * Detecte les lettres qui ont demande de l'aide ou plusieurs essais recemment.
 */
function getRecentProblemLetters(progress: AppProgress) {
  const letters = progress.sessions
    .slice(-3)
    .flatMap((session) => session.exercises)
    .filter((exercise) => exercise.helped || exercise.attempts > 1 || !exercise.success)
    .map((exercise) => exercise.letter)

  return uniqueLetters(letters)
}

/**
 * Indique si une lettre connue est stable et peut etre moins frequente.
 */
function isStableLetter(
  progress: LetterProgress,
  recentProblemLetters: LetterSymbol[],
) {
  return (
    progress.status === 'known' &&
    progress.successWithoutHelpCount >= 4 &&
    progress.currentStreak >= 4 &&
    !recentProblemLetters.includes(progress.letter)
  )
}

/**
 * Planifie une petite revision si une lettre connue n'a pas ete vue recemment.
 */
function isDueForReview(progress: LetterProgress, now: string) {
  if (progress.status !== 'known' || !progress.lastSeenAt) {
    return false
  }

  const daysSinceLastSeen =
    (new Date(now).getTime() - new Date(progress.lastSeenAt).getTime()) /
    (1000 * 60 * 60 * 24)

  return daysSinceLastSeen >= 7
}

/**
 * Autorise la nomination seulement lorsque la reconnaissance est stable.
 */
function isReadyForNaming(
  progress: LetterProgress,
  context: SessionAdaptationContext,
) {
  return (
    (progress.status === 'learning' || progress.status === 'known') &&
    progress.successWithoutHelpCount >= 3 &&
    progress.currentStreak >= 3 &&
    progress.knownSessionCount >= 1 &&
    !context.recentProblemLetters.includes(progress.letter)
  )
}

function getChoices(
  type: ExerciseType,
  letter: LetterSymbol,
  sessionLetters: LetterSymbol[],
  random: () => number,
) {
  if (type === 'association' || type === 'naming') {
    return [letter]
  }

  const choiceCount = type === 'twoChoice' ? 2 : 3
  const distractors = shuffle(
    sessionLetters.filter((candidate) => candidate !== letter),
    random,
  ).slice(0, choiceCount - 1)

  return shuffle([letter, ...distractors], random)
}

/**
 * Crée la consigne textuelle d'un exercice.
 */
function getPrompt(type: ExerciseType, letter: LetterSymbol) {
  if (type === 'association') {
    return getLetterCard(letter)?.audioText ?? `${letter} comme ${letter}`
  }

  if (type === 'naming') {
    return "Tu te rappelles comment elle s'appelle ?"
  }

  return `Montre-moi le ${letter}`
}

/**
 * Calcule un score simple de difficulté.
 */
function getDifficultyScore(progress: LetterProgress | undefined) {
  if (!progress) {
    return 0
  }

  return progress.errorCount * 2 + progress.helpCount - progress.successWithoutHelpCount
}

/**
 * Tire un nombre cible d'exercices entre les bornes prévues.
 */
function getTargetExerciseCount(random: () => number, letterCount: number) {
  const range = SESSION_EXERCISE_COUNT.targetMax - SESSION_EXERCISE_COUNT.targetMin + 1
  const baseCount = SESSION_EXERCISE_COUNT.targetMin + Math.floor(random() * range)
  const extraCoverageCount = Math.max(0, letterCount - 4) * 2

  return Math.max(letterCount, baseCount + extraCoverageCount)
}

/**
 * Ajoute des lettres sans doublon jusqu'à une limite.
 */
function addLetters(
  selectedLetters: LetterSymbol[],
  candidates: Array<LetterProgress | LetterSymbol>,
  maxCount: number,
) {
  candidates.forEach((candidate) => {
    const letter = typeof candidate === 'string' ? candidate : candidate.letter

    if (selectedLetters.length < maxCount && !selectedLetters.includes(letter)) {
      selectedLetters.push(letter)
    }
  })
}

/**
 * Mélange une liste avec un générateur aléatoire injectable.
 */
function shuffle<T>(items: T[], random: () => number) {
  return [...items].sort(() => random() - 0.5)
}

/**
 * Déduplique une liste de lettres en conservant l'ordre.
 */
function uniqueLetters(letters: LetterSymbol[]) {
  return [...new Set(letters)]
}

/**
 * Convertit une date optionnelle en valeur triable.
 */
function getDateValue(value: string | null) {
  return value ? new Date(value).getTime() : 0
}
