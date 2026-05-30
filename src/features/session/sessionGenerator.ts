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
  const activeLetters = selectActiveLetters(progress, random)
  const exercises = buildExercises(progress, activeLetters, random)

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
function selectActiveLetters(progress: AppProgress, random: () => number): LetterSymbol[] {
  const groups = groupLetters(progress)
  const selectedLetters: LetterSymbol[] = []
  const activeLearningLetters = [...groups.fragile, ...groups.learning].filter((letterProgress) =>
    progress.activeLetters.includes(letterProgress.letter),
  )
  const knownReviewLetters = groups.known.filter((letterProgress) =>
    progress.activeLetters.includes(letterProgress.letter),
  )

  addLetters(selectedLetters, sortByPriority(groups.fragile), 3)
  addLetters(selectedLetters, shuffle(activeLearningLetters, random), 4)
  addLetters(selectedLetters, getKnownLettersToReview(knownReviewLetters), 1)

  if (canIntroduceNewLetter(progress, groups, selectedLetters)) {
    addLetters(selectedLetters, groups.newLetters, 1)
  }

  addLetters(selectedLetters, shuffle(activeLearningLetters, random), 5)
  addLetters(selectedLetters, getFallbackLetters(progress), 3)

  return selectedLetters.slice(0, 5)
}

/**
 * Construit les exercices dans l'ordre pédagogique de la séance.
 */
function buildExercises(
  progress: AppProgress,
  letters: LetterSymbol[],
  random: () => number,
): PlannedExercise[] {
  const targetCount = getTargetExerciseCount(random)
  const exercises: PlannedExercise[] = []
  const easyLetters = getEasyStartLetters(progress, letters)
  const weightedLetters = getWeightedLetters(progress, letters)

  easyLetters.slice(0, 2).forEach((letter, index) => {
    exercises.push(createPlannedExercise(index, 'recognition', letter, letters, random))
  })

  while (exercises.length < targetCount) {
    const letter = weightedLetters[exercises.length % weightedLetters.length]
    const type = getExerciseType(progress.letters[letter], exercises.length)
    exercises.push(createPlannedExercise(exercises.length, type, letter, letters, random))
  }

  return exercises.slice(0, SESSION_EXERCISE_COUNT.hardMax)
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
  selectedLetters: LetterSymbol[],
) {
  const unstableActiveLetterCount = progress.activeLetters.filter((letter) => {
    return progress.letters[letter]?.status !== 'known'
  }).length

  return (
    groups.fragile.length === 0 &&
    unstableActiveLetterCount <= 1 &&
    selectedLetters.length < 5 &&
    groups.newLetters.length > 0
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
function getWeightedLetters(progress: AppProgress, letters: LetterSymbol[]) {
  const weightedLetters = letters.flatMap((letter) => {
    const status = progress.letters[letter]?.status

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
function getExerciseType(progress: LetterProgress | undefined, index: number): ExerciseType {
  if (!progress || progress.status === 'new') {
    return index % 2 === 0 ? 'discovery' : 'recognition'
  }

  if (progress.status === 'known' && progress.successWithoutHelpCount >= 4) {
    return index % 4 === 0 ? 'naming' : 'choice'
  }

  if (progress.status === 'fragile') {
    return index % 3 === 0 ? 'association' : 'choice'
  }

  return index % 3 === 0 ? 'association' : 'choice'
}

/**
 * Construit les choix affichés pour un exercice.
 */
function getChoices(
  type: ExerciseType,
  letter: LetterSymbol,
  sessionLetters: LetterSymbol[],
  random: () => number,
) {
  if (type === 'discovery' || type === 'association' || type === 'naming') {
    return [letter]
  }

  const choiceCount = type === 'recognition' ? 2 : 3
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
  if (type === 'discovery' || type === 'association') {
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
function getTargetExerciseCount(random: () => number) {
  const range = SESSION_EXERCISE_COUNT.targetMax - SESSION_EXERCISE_COUNT.targetMin + 1
  return SESSION_EXERCISE_COUNT.targetMin + Math.floor(random() * range)
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
