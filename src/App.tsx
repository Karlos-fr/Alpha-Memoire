/**
 * Composant racine de l'application Alpha-Mémoire.
 *
 * Expose l'accueil enfant, le déroulé d'une séance et l'écran de fin positif.
 */

import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getLetterCard, INITIAL_LETTER_CARDS } from './data/letters'
import {
  recordError,
  recordExposure,
  recordSuccessWithHelp,
  recordSuccessWithoutHelp,
} from './features/progress/progressEngine'
import { generateSessionPlan } from './features/session/sessionGenerator'
import { useSpeech } from './hooks/useSpeech'
import { CHILD_NAME, INITIAL_ACTIVE_LETTERS } from './lib/appConfig'
import {
  ensureStoredProgress,
  saveProgress,
  saveSession,
} from './lib/progressStorage'
import type {
  AppProgress,
  ExerciseResult,
  ExerciseType,
  LetterSymbol,
  PlannedExercise,
  SessionPlan,
} from './types'

/**
 * Vue actuellement affichée par l'application.
 */
type AppView = 'home' | 'session' | 'complete'

/**
 * État transitoire du feedback enfant.
 */
type FeedbackState = 'idle' | 'success' | 'help'

/**
 * État visuel du compagnon de mission.
 */
type CompanionMood = 'ready' | 'listening' | 'helping' | 'celebrating'

/**
 * Résultat pédagogique appliqué à la progression.
 */
type ProgressOutcome = 'exposure' | 'successWithoutHelp' | 'successWithHelp' | 'error'

/**
 * Options de fin d'exercice.
 */
interface CompleteExerciseOptions {
  usedHelp?: boolean
  parentValidated?: boolean
  outcome?: ProgressOutcome
  shouldPraise?: boolean
}

/**
 * Délai court pour passer une étape sans félicitation audio.
 */
const QUICK_TRANSITION_MS = 180

/**
 * Délai laissé à la félicitation avant de changer d'écran.
 */
const PRAISE_TRANSITION_MS = 1800

/**
 * Modes d'exercices exposés dans le panneau de test parent.
 */
const DEBUG_EXERCISE_TYPES = [
  'discovery',
  'recognition',
  'choice',
  'association',
  'naming',
] as const satisfies readonly ExerciseType[]

/**
 * Libellés courts du panneau debug.
 */
const DEBUG_EXERCISE_LABELS: Record<ExerciseType, string> = {
  discovery: 'Découverte',
  recognition: 'Reconnaissance',
  choice: 'Choix',
  association: 'Association',
  naming: 'Nommer',
}

/**
 * Affiche l'application enfant principale.
 */
function App() {
  const hasTriedAutoSpeech = useRef(false)
  const sessionStartedAt = useRef<string | null>(null)
  const exerciseStartedAt = useRef<string | null>(null)
  const welcomeInstruction = `Bonjour ${CHILD_NAME}. Prêt pour la mission des lettres ?`
  const speech = useSpeech({
    defaultText: welcomeInstruction,
  })
  const [progress, setProgress] = useState<AppProgress>(() => ensureStoredProgress())
  const [view, setView] = useState<AppView>('home')
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [results, setResults] = useState<ExerciseResult[]>([])
  const [attempts, setAttempts] = useState(0)
  const [helped, setHelped] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const [isDebugSession, setIsDebugSession] = useState(false)

  const currentExercise = sessionPlan?.exercises[currentExerciseIndex] ?? null
  const currentCard = currentExercise ? getLetterCard(currentExercise.letter) : null
  const completedCount = results.length
  const totalCount = sessionPlan?.exercises.length ?? 0
  const lastMessage = useMemo(() => {
    if (feedback === 'success') {
      return `Bravo ${CHILD_NAME} !`
    }

    if (feedback === 'help') {
      return 'Regardons ensemble.'
    }

    return currentExercise ? getDisplayedPrompt(currentExercise) : welcomeInstruction
  }, [currentExercise, feedback, welcomeInstruction])

  useEffect(() => {
    if (hasTriedAutoSpeech.current) {
      return
    }

    hasTriedAutoSpeech.current = true
    speech.speak(welcomeInstruction)
  }, [speech, welcomeInstruction])

  /**
   * Lance une nouvelle séance enfant.
   */
  function startSession() {
    const storedProgress = ensureStoredProgress()
    const nextPlan = generateSessionPlan(storedProgress)

    sessionStartedAt.current = new Date().toISOString()
    exerciseStartedAt.current = sessionStartedAt.current
    setProgress(storedProgress)
    setSessionPlan(nextPlan)
    setCurrentExerciseIndex(0)
    setResults([])
    setAttempts(0)
    setHelped(false)
    setFeedback('idle')
    setIsDebugSession(false)
    setView('session')
    speech.speak(nextPlan.exercises[0]?.prompt ?? welcomeInstruction)
  }

  /**
   * Lance un exercice isolé pour tester rapidement un mode sans sauvegarder.
   */
  function startDebugExercise(type: ExerciseType) {
    const storedProgress = ensureStoredProgress()
    const nextPlan = createDebugSessionPlan(type)

    sessionStartedAt.current = new Date().toISOString()
    exerciseStartedAt.current = sessionStartedAt.current
    setProgress(storedProgress)
    setSessionPlan(nextPlan)
    setCurrentExerciseIndex(0)
    setResults([])
    setAttempts(0)
    setHelped(false)
    setFeedback('idle')
    setIsDebugSession(true)
    setView('session')
    speech.speak(nextPlan.exercises[0].prompt)
  }

  /**
   * Réagit au choix d'une lettre par l'enfant.
   */
  function handleLetterChoice(choice: LetterSymbol) {
    if (!currentExercise || !progress) {
      return
    }

    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)

    if (choice !== currentExercise.letter) {
      const nextProgress = updateLetterProgress(progress, currentExercise, 'error')
      setProgress(nextProgress)
      setHelped(true)
      setFeedback('help')
      speech.speak(`Presque ${CHILD_NAME}. Regarde avec moi.`)
      return
    }

    completeExercise(currentExercise, nextAttempts, {
      usedHelp: helped,
    })
  }

  /**
   * Valide une étape sans choix de lettre.
   */
  function handleContinue() {
    if (!currentExercise) {
      return
    }

    completeExercise(currentExercise, Math.max(1, attempts + 1), {
      outcome: 'exposure',
      shouldPraise: false,
    })
  }

  /**
   * Valide une réponse orale avec l'aide du parent.
   */
  function handleNaming(parentValidated: boolean) {
    if (!currentExercise) {
      return
    }

    if (parentValidated) {
      completeExercise(currentExercise, 1, {
        parentValidated: true,
      })
      return
    }

    setHelped(true)
    completeExercise(currentExercise, 1, {
      usedHelp: true,
      parentValidated: true,
    })
  }

  /**
   * Termine un exercice puis avance dans la séance.
   */
  function completeExercise(
    exercise: PlannedExercise,
    attemptCount: number,
    options: CompleteExerciseOptions = {},
  ) {
    if (!progress || !sessionPlan) {
      return
    }

    const usedHelp = options.usedHelp ?? false
    const parentValidated = options.parentValidated ?? false
    const outcome =
      options.outcome ?? (usedHelp ? 'successWithHelp' : 'successWithoutHelp')
    const shouldPraise = options.shouldPraise ?? true
    const completedAt = new Date().toISOString()
    const nextProgress = isDebugSession
      ? progress
      : updateLetterProgress(progress, exercise, outcome)
    const result: ExerciseResult = {
      id: `${sessionPlan.id}-${exercise.id}`,
      type: exercise.type,
      letter: exercise.letter,
      choices: exercise.choices,
      scored: outcome !== 'exposure',
      success: true,
      attempts: attemptCount,
      helped: usedHelp,
      parentValidated,
      startedAt: exerciseStartedAt.current ?? sessionStartedAt.current ?? sessionPlan.createdAt,
      completedAt,
    }
    const nextResults = [...results, result]

    setProgress(nextProgress)
    setResults(nextResults)
    setFeedback(shouldPraise ? 'success' : 'idle')

    if (shouldPraise) {
      speech.speak(`Bravo ${CHILD_NAME} !`)
    }

    window.setTimeout(() => {
      const nextIndex = currentExerciseIndex + 1

      if (nextIndex >= sessionPlan.exercises.length) {
        finishSession(nextProgress, nextResults)
        return
      }

      setCurrentExerciseIndex(nextIndex)
      setAttempts(0)
      setHelped(false)
      setFeedback('idle')
      exerciseStartedAt.current = new Date().toISOString()
      speech.speak(sessionPlan.exercises[nextIndex].prompt)
    }, shouldPraise ? PRAISE_TRANSITION_MS : QUICK_TRANSITION_MS)
  }

  /**
   * Sauvegarde la séance terminée et affiche l'écran final.
   */
  function finishSession(nextProgress: AppProgress, nextResults: ExerciseResult[]) {
    if (!sessionPlan) {
      return
    }

    if (isDebugSession) {
      setView('complete')
      speech.speak(`Test terminé ${CHILD_NAME}.`)
      return
    }

    const endedAt = new Date().toISOString()
    const startedAt = sessionStartedAt.current ?? sessionPlan.createdAt
    const sessionRecord = {
      id: sessionPlan.id,
      startedAt,
      endedAt,
      durationSeconds: Math.max(
        1,
        Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000),
      ),
      exercises: nextResults,
      summary: {
        successes: nextResults.filter((result) => result.scored && result.success).length,
        errors: nextResults.filter((result) => result.scored && !result.success).length,
        helpedCount: nextResults.filter((result) => result.helped).length,
        lettersPracticed: [...new Set(nextResults.map((result) => result.letter))],
        fragileLetters: Object.values(nextProgress.letters)
          .filter((letterProgress) => letterProgress.status === 'fragile')
          .map((letterProgress) => letterProgress.letter),
        knownLetters: Object.values(nextProgress.letters)
          .filter((letterProgress) => letterProgress.status === 'known')
          .map((letterProgress) => letterProgress.letter),
      },
    }
    const storedProgress = saveSession(nextProgress, sessionRecord)

    setProgress(storedProgress)
    setView('complete')
    speech.speak(`Bravo ${CHILD_NAME}, mission terminée.`)
  }

  /**
   * Met à jour et sauvegarde la progression d'une lettre.
   */
  function updateLetterProgress(
    currentProgress: AppProgress,
    exercise: PlannedExercise,
    outcome: ProgressOutcome,
  ) {
    const letterProgress = currentProgress.letters[exercise.letter]
    const context = {
      occurredAt: new Date().toISOString(),
      sessionId: sessionPlan?.id ?? 'session-preview',
    }
    const nextLetterProgress =
      outcome === 'exposure'
        ? recordExposure(letterProgress, context)
        : outcome === 'successWithoutHelp'
        ? recordSuccessWithoutHelp(letterProgress, context)
        : outcome === 'successWithHelp'
          ? recordSuccessWithHelp(letterProgress, context)
          : recordError(letterProgress, context)
    const nextProgress = saveProgress({
      ...currentProgress,
      letters: {
        ...currentProgress.letters,
        [exercise.letter]: nextLetterProgress,
      },
    })

    return nextProgress
  }

  if (view === 'session' && currentExercise) {
    const companionMood =
      feedback === 'help' ? 'helping' : feedback === 'success' ? 'celebrating' : 'listening'
    const shouldHideTargetText = hidesTargetText(currentExercise)

    return (
      <main className="app-shell session-shell">
        <section className="session-view" aria-label="Exercice en cours">
          <header className="session-header">
            <div className="mission-brand">
              <MissionCompanion mood={companionMood} />
              <p className="eyebrow">Mission lettres</p>
            </div>
            <p className="session-count">
              {isDebugSession ? 'Debug' : `${completedCount + 1} / ${totalCount}`}
            </p>
          </header>

          <div className={`exercise-stage ${feedback}`}>
            <p className="spoken-instruction" aria-live="polite">
              {lastMessage}
            </p>
            {shouldHideTargetText && currentCard ? (
              <img
                className="letter-image-prompt"
                src={currentCard.image.src}
                alt={currentCard.image.alt}
              />
            ) : (
              <>
                <h1 id="exercise-title" className="exercise-letter">
                  {currentExercise.letter}
                </h1>
                {currentCard && (
                  <div className="letter-word">
                    <span className="letter-visual">{currentCard.temporaryVisual}</span>
                    <span>{currentCard.word}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {renderExerciseControls(currentExercise)}
        </section>
      </main>
    )
  }

  if (view === 'complete') {
    return (
      <main className="app-shell">
        <section className="complete-view" aria-labelledby="complete-title">
          <MissionCompanion mood="celebrating" />
          <p className="eyebrow">Mission terminée</p>
          <h1 id="complete-title">Bravo {CHILD_NAME}</h1>
          <p className="intro">Tu as travaillé les lettres avec beaucoup d'attention.</p>
          <div className="actions">
            <button type="button" className="primary-action" onClick={startSession}>
              Nouvelle séance
            </button>
            <button type="button" className="voice-action" onClick={() => speech.speak()}>
              Réécouter
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="app-title">
        <div className="mission-panel">
          <div className="mission-brand">
            <MissionCompanion mood="ready" />
            <p className="eyebrow">Mission lettres</p>
          </div>
          <h1 id="app-title">Alpha-Mémoire</h1>
          <p className="intro">
            Un espace doux pour aider {CHILD_NAME} à reconnaître les lettres, les
            entendre et les nommer séance après séance.
          </p>
          <div className="actions" aria-label="Actions principales">
            <button type="button" className="primary-action" onClick={startSession}>
              Démarrer une séance
            </button>
            <button type="button" className="secondary-action">
              Espace parent
            </button>
            <button
              type="button"
              className="voice-action"
              onClick={() => speech.speak(welcomeInstruction)}
            >
              Réécouter
            </button>
          </div>
          <div className="debug-panel" aria-label="Tests rapides des exercices">
            <p className="debug-title">Debug exercices</p>
            <div className="debug-actions">
              {DEBUG_EXERCISE_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  className="debug-action"
                  onClick={() => startDebugExercise(type)}
                >
                  {DEBUG_EXERCISE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
          <p className="spoken-instruction" aria-live="polite">
            {welcomeInstruction}
          </p>
          {!speech.isSupported && (
            <p className="speech-fallback" role="status">
              La voix n'est pas disponible sur ce navigateur. La consigne reste
              affichée à l'écran.
            </p>
          )}
        </div>

        <div
          className="letter-preview"
          aria-label={`Premier groupe de lettres : ${INITIAL_ACTIVE_LETTERS.join(
            ', ',
          )}`}
        >
          {INITIAL_LETTER_CARDS.map((card) => (
            <span key={card.letter} aria-label={card.audioText}>
              {card.letter}
            </span>
          ))}
        </div>
      </section>
    </main>
  )

  /**
   * Affiche les contrôles attendus pour le type d'exercice courant.
   */
  function renderExerciseControls(exercise: PlannedExercise) {
    if (exercise.type === 'discovery' || exercise.type === 'association') {
      return (
        <div className="exercise-actions">
          <button type="button" className="primary-action" onClick={handleContinue}>
            Continuer
          </button>
          <button
            type="button"
            className="voice-action"
            onClick={() => speech.speak(exercise.prompt)}
          >
            Réécouter
          </button>
        </div>
      )
    }

    if (exercise.type === 'naming') {
      return (
        <div className="exercise-actions">
          <button
            type="button"
            className="primary-action"
            onClick={() => handleNaming(true)}
          >
            Il a trouvé
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={() => handleNaming(false)}
          >
            Avec aide
          </button>
          <button
            type="button"
            className="voice-action"
            onClick={() => speech.speak(exercise.prompt)}
          >
            Réécouter
          </button>
        </div>
      )
    }

    return (
      <div className="choice-grid">
        {exercise.choices.map((choice) => (
          <button
            type="button"
            key={choice}
            className={`choice-button ${
              helped && choice === exercise.letter ? 'is-helped' : ''
            }`}
            onClick={() => handleLetterChoice(choice)}
          >
            {choice}
          </button>
        ))}
        <button
          type="button"
          className="voice-action choice-repeat"
          onClick={() => speech.speak(exercise.prompt)}
        >
          Réécouter
        </button>
      </div>
    )
  }
}

/**
 * Petit compagnon droïde original pour l'univers mission-espace.
 */
function MissionCompanion({ mood }: { mood: CompanionMood }) {
  return (
    <div className={`mission-companion ${mood}`} aria-hidden="true">
      <div className="companion-antenna" />
      <div className="companion-head">
        <span className="companion-eye" />
        <span className="companion-eye" />
      </div>
      <div className="companion-body">
        <span />
        <span />
      </div>
    </div>
  )
}

/**
 * Masque la lettre cible dans les consignes visuelles de reconnaissance.
 */
function getDisplayedPrompt(exercise: PlannedExercise) {
  if (hidesTargetText(exercise)) {
    return 'Écoute puis choisis la bonne lettre.'
  }

  return exercise.prompt
}

/**
 * Indique les exercices où l'écran ne doit pas donner la réponse par écrit.
 */
function hidesTargetText(exercise: PlannedExercise) {
  return exercise.type === 'recognition' || exercise.type === 'choice'
}

/**
 * Crée une mini-séance locale pour inspecter un type d'exercice précis.
 */
function createDebugSessionPlan(type: ExerciseType): SessionPlan {
  const letter = 'T'
  const card = getLetterCard(letter)
  const createdAt = new Date().toISOString()

  return {
    id: `debug-session-${type}-${createdAt}`,
    exercises: [
      {
        id: `debug-${type}`,
        type,
        letter,
        choices: getDebugChoices(type, letter),
        prompt: getDebugPrompt(type, letter, card?.audioText),
      },
    ],
    letters: [letter],
    introducedLetters: [],
    createdAt,
  }
}

/**
 * Fournit des choix fixes pour rendre le debug prévisible.
 */
function getDebugChoices(type: ExerciseType, letter: LetterSymbol) {
  if (type === 'recognition') {
    return [letter, 'N']
  }

  if (type === 'choice') {
    return ['N', letter, 'A']
  }

  return [letter]
}

/**
 * Reproduit les consignes du générateur de séance pour un exercice debug.
 */
function getDebugPrompt(
  type: ExerciseType,
  letter: LetterSymbol,
  associationPrompt?: string,
) {
  if (type === 'discovery' || type === 'association') {
    return associationPrompt ?? `${letter} comme ${letter}`
  }

  if (type === 'naming') {
    return "Tu te rappelles comment elle s'appelle ?"
  }

  return `Montre-moi le ${letter}`
}

export default App
