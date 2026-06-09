/**
 * Composant racine de l'application Alpha-Mémoire.
 *
 * Expose l'accueil enfant, le déroulé d'une séance et l'écran de fin positif.
 */

import './App.css'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { getLetterCard, INITIAL_LETTER_CARDS, LETTER_ALPHABET } from './data/letters'
import { getRandomSpeechPhrase } from './data/speechPhrases'
import {
  recordError,
  recordExposure,
  recordSuccessWithHelp,
  recordSuccessWithoutHelp,
} from './features/progress/progressEngine'
import { generateSessionPlan } from './features/session/sessionGenerator'
import { useSpeech } from './hooks/useSpeech'
import { CHILD_NAME, INITIAL_ACTIVE_LETTERS, SHOW_IMAGES_STORAGE_KEY } from './lib/appConfig'
import {
  createInitialProgress,
  ensureStoredProgress,
  exportProgressToJson,
  importProgressFromJson,
  saveProgress,
  saveSession,
} from './lib/progressStorage'
import type {
  AppProgress,
  ExerciseResult,
  ExerciseType,
  LetterProgress,
  LetterStatus,
  LetterSymbol,
  PlannedExercise,
  SessionRecord,
  SessionPlan,
} from './types'

/**
 * Vue actuellement affichée par l'application.
 */
type AppView = 'home' | 'session' | 'complete' | 'parent'

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
  'twoChoice',
  'threeChoice',
  'association',
  'naming',
] as const satisfies readonly ExerciseType[]

/**
 * Libellés courts du panneau debug.
 */
const DEBUG_EXERCISE_LABELS: Record<ExerciseType, string> = {
  twoChoice: 'Choix 2 lettres',
  threeChoice: 'Choix 3 lettres',
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
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [welcomeInstruction] = useState(() => getRandomSpeechPhrase('welcome'))
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
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [parentMessage, setParentMessage] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [showImages, setShowImages] = useState(() => loadShowImagesPreference())

  const currentExercise = sessionPlan?.exercises[currentExerciseIndex] ?? null
  const currentCard = currentExercise ? getLetterCard(currentExercise.letter) : null
  const totalCount = sessionPlan?.exercises.length ?? 0
  const selectedSession =
    progress.sessions.find((session) => session.id === selectedSessionId) ??
    progress.sessions.at(-1) ??
    null
  const lastMessage = useMemo(() => {
    if (feedback === 'success') {
      return feedbackMessage ?? getRandomSpeechPhrase('praise')
    }

    if (feedback === 'help') {
      return feedbackMessage ?? getRandomSpeechPhrase('help')
    }

    return currentExercise ? getDisplayedPrompt(currentExercise) : welcomeInstruction
  }, [currentExercise, feedback, feedbackMessage, welcomeInstruction])

  useEffect(() => {
    if (hasTriedAutoSpeech.current) {
      return
    }

    if (speech.isSupported && !speech.voicesLoaded) {
      return
    }

    hasTriedAutoSpeech.current = true
    speech.speak(welcomeInstruction)
  }, [speech, speech.voicesLoaded, welcomeInstruction])

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
    setFeedbackMessage(null)
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
    setFeedbackMessage(null)
    setIsDebugSession(true)
    setView('session')
    speech.speak(nextPlan.exercises[0].prompt)
  }

  /**
   * Ouvre l'espace parent avec les donnees les plus recentes.
   */
  function openParentDashboard() {
    const storedProgress = ensureStoredProgress()

    setProgress(storedProgress)
    setSelectedSessionId(storedProgress.sessions.at(-1)?.id ?? null)
    setParentMessage(null)
    setView('parent')
  }

  /**
   * Exporte la progression complete au format JSON.
   */
  function handleExportProgress() {
    const json = exportProgressToJson(progress)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `alpha-memoire-${CHILD_NAME.toLowerCase()}-progression.json`
    link.click()
    URL.revokeObjectURL(url)
    setParentMessage('Export JSON prêt.')
  }

  /**
   * Importe un fichier JSON choisi par le parent.
   */
  async function handleImportProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const nextProgress = importProgressFromJson(await file.text())
      setProgress(nextProgress)
      setSelectedSessionId(nextProgress.sessions.at(-1)?.id ?? null)
      setParentMessage('Import JSON terminé.')
    } catch (error) {
      setParentMessage(error instanceof Error ? error.message : 'Import JSON impossible.')
    } finally {
      event.target.value = ''
    }
  }

  /**
   * Reinitialise la progression apres confirmation explicite.
   */
  function handleResetProgress() {
    if (!window.confirm('Réinitialiser toute la progression de Nathan ?')) {
      return
    }

    const nextProgress = saveProgress(createInitialProgress())

    setProgress(nextProgress)
    setSelectedSessionId(null)
    setParentMessage('Progression réinitialisée.')
  }

  /**
   * Active ou masque les images des exercices et conserve le choix localement.
   */
  function handleShowImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const nextShowImages = event.target.checked

    setShowImages(nextShowImages)
    saveShowImagesPreference(nextShowImages)
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
      const helpMessage = getRandomSpeechPhrase('help')
      setProgress(nextProgress)
      setHelped(true)
      setFeedback('help')
      setFeedbackMessage(helpMessage)
      speech.speak(helpMessage)
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
    const praiseMessage = shouldPraise ? getRandomSpeechPhrase('praise') : null
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
    setFeedbackMessage(praiseMessage)

    if (praiseMessage) {
      speech.speak(praiseMessage)
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
      setFeedbackMessage(null)
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
    speech.speak(getRandomSpeechPhrase('sessionComplete'))
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
              {isDebugSession ? 'Debug' : `${currentExerciseIndex + 1} / ${totalCount}`}
            </p>
          </header>

          <div className={`exercise-stage ${feedback}`}>
            <p className="spoken-instruction" aria-live="polite">
              {lastMessage}
            </p>
            {shouldHideTargetText ? (
              currentCard && showImages ? (
                <img
                  className="letter-image-prompt"
                  src={currentCard.image.src}
                  alt={currentCard.image.alt}
                />
              ) : null
            ) : (currentExercise.type === 'association' ||
                currentExercise.type === 'naming') &&
              currentCard ? (
              <div className="association-content">
                <div className="association-letter-stack">
                  <h1 id="exercise-title" className="exercise-letter">
                    {currentExercise.letter}
                  </h1>
                  <div className="letter-word">
                    <span className="letter-visual">{currentCard.temporaryVisual}</span>
                    <span>{currentCard.word}</span>
                  </div>
                </div>
                {showImages && (
                  <img
                    className="letter-association-image"
                    src={currentCard.image.src}
                    alt={currentCard.image.alt}
                  />
                )}
              </div>
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
            <button type="button" className="secondary-action" onClick={() => setView('home')}>
              Accueil
            </button>
            <button type="button" className="voice-action" onClick={() => speech.speak()}>
              Réécouter
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (view === 'parent') {
    const knownLetters = getLettersByStatus(progress, 'known')
    const learningLetters = getLettersByStatus(progress, 'learning')
    const fragileLetters = getLettersByStatus(progress, 'fragile')
    const lastSession = progress.sessions.at(-1) ?? null

    return (
      <main className="app-shell parent-shell">
        <section className="parent-view" aria-labelledby="parent-title">
          <header className="parent-header">
            <div>
              <p className="eyebrow">Espace parent</p>
              <h1 id="parent-title">Tableau de bord</h1>
            </div>
            <div className="parent-nav">
              <button type="button" className="secondary-action" onClick={() => setView('home')}>
                Accueil
              </button>
              <button type="button" className="voice-action" onClick={handleExportProgress}>
                Export JSON
              </button>
              <button
                type="button"
                className="secondary-action"
                onClick={() => importInputRef.current?.click()}
              >
                Import JSON
              </button>
              <button type="button" className="danger-action" onClick={handleResetProgress}>
                Réinitialiser
              </button>
              <input
                ref={importInputRef}
                className="hidden-file-input"
                type="file"
                accept="application/json,.json"
                onChange={handleImportProgress}
              />
            </div>
          </header>

          {parentMessage && (
            <p className="parent-message" role="status">
              {parentMessage}
            </p>
          )}

          <section className="parent-section parent-settings" aria-labelledby="settings-title">
            <h2 id="settings-title">Options</h2>
            <label className="setting-toggle">
              <input
                type="checkbox"
                checked={showImages}
                onChange={handleShowImagesChange}
              />
              <span>Afficher les images pendant les exercices</span>
            </label>
          </section>

          <div className="parent-summary">
            <ParentMetric label="Séances" value={progress.sessions.length.toString()} />
            <ParentMetric label="Dernière séance" value={formatDate(lastSession?.endedAt)} />
            <ParentMetric label="Connues" value={knownLetters.length.toString()} />
            <ParentMetric label="Fragiles" value={fragileLetters.length.toString()} />
          </div>

          <ParentCharts sessions={progress.sessions} />

          <div className="parent-columns">
            <section className="parent-section" aria-labelledby="status-title">
              <h2 id="status-title">Progression lettres</h2>
              <div className="letter-status-groups">
                <LetterGroup title="Connues" letters={knownLetters} emptyLabel="Aucune" />
                <LetterGroup
                  title="En apprentissage"
                  letters={learningLetters}
                  emptyLabel="Aucune"
                />
                <LetterGroup title="Fragiles" letters={fragileLetters} emptyLabel="Aucune" />
              </div>
              <div className="letter-progress-grid">
                {LETTER_ALPHABET.map((letter) => (
                  <LetterProgressTile
                    key={letter}
                    progress={progress.letters[letter]}
                  />
                ))}
              </div>
            </section>

            <section className="parent-section" aria-labelledby="history-title">
              <h2 id="history-title">Historique</h2>
              {progress.sessions.length === 0 ? (
                <p className="empty-state">Aucune séance terminée pour le moment.</p>
              ) : (
                <div className="session-history">
                  {progress.sessions
                    .slice()
                    .reverse()
                    .map((session, index) => (
                      <button
                        type="button"
                        key={session.id}
                        className={`session-history-item ${
                          selectedSession?.id === session.id ? 'is-selected' : ''
                        }`}
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        <span>Séance {progress.sessions.length - index}</span>
                        <span>{formatDate(session.endedAt)}</span>
                        <span>
                          {session.exercises.length} ex. / {session.durationSeconds}s
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </section>
          </div>

          <section className="parent-section" aria-labelledby="session-detail-title">
            <h2 id="session-detail-title">Détail de séance</h2>
            {selectedSession ? (
              <SessionDetail session={selectedSession} />
            ) : (
              <p className="empty-state">Sélectionne une séance pour voir le détail.</p>
            )}
          </section>
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
            <button type="button" className="secondary-action" onClick={openParentDashboard}>
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
    if (exercise.type === 'association') {
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
 * Indicateur synthetique de l'espace parent.
 */
function ParentMetric({ label, value }: { label: string; value: string }) {
  const metricClassName = label === 'Dernière séance'
    ? 'parent-metric is-date-metric'
    : 'parent-metric'

  return (
    <div className={metricClassName}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

/**
 * Liste compacte de lettres par statut.
 */
function LetterGroup({
  title,
  letters,
  emptyLabel,
}: {
  title: string
  letters: LetterProgress[]
  emptyLabel: string
}) {
  return (
    <div className="letter-group">
      <p>{title}</p>
      <div>
        {letters.length > 0
          ? letters.map((progress) => <span key={progress.letter}>{progress.letter}</span>)
          : emptyLabel}
      </div>
    </div>
  )
}

/**
 * Carte compacte d'une lettre dans le tableau de bord.
 */
function LetterProgressTile({ progress }: { progress: LetterProgress }) {
  return (
    <div className={`letter-progress-tile ${progress.status}`}>
      <strong>{progress.letter}</strong>
      <span>{getStatusLabel(progress.status)}</span>
      <small>
        {progress.successWithoutHelpCount} ok / {progress.errorCount} err.
      </small>
    </div>
  )
}

/**
 * Graphiques de suivi bases sur les dernieres seances terminees.
 */
function ParentCharts({ sessions }: { sessions: SessionRecord[] }) {
  const recentSessions = sessions.slice(-8)

  if (recentSessions.length === 0) {
    return (
      <section className="parent-section parent-charts" aria-labelledby="charts-title">
        <h2 id="charts-title">Évolution</h2>
        <p className="empty-state">Aucune donnée de séance pour le moment.</p>
      </section>
    )
  }

  const maxKnown = Math.max(
    1,
    ...recentSessions.map((session) => session.summary.knownLetters.length),
  )

  return (
    <section className="parent-section parent-charts" aria-labelledby="charts-title">
      <h2 id="charts-title">Évolution</h2>
      <div className="chart-grid">
        <div className="chart-panel">
          <h3>Résultats par séance</h3>
          <div className="session-bars">
            {recentSessions.map((session, index) => {
              const exerciseCount = Math.max(1, session.exercises.length)
              const helpedCount = session.summary.helpedCount
              const errorCount = getSessionAttemptErrorCount(session)
              const successCount = Math.max(
                0,
                exerciseCount - helpedCount - errorCount,
              )

              return (
                <div className="session-bar-row" key={session.id}>
                  <span>S{sessions.length - recentSessions.length + index + 1}</span>
                  <div className="stacked-bar" aria-hidden="true">
                    <span
                      className="bar-success"
                      style={{ width: `${getPercent(successCount, exerciseCount)}%` }}
                    />
                    <span
                      className="bar-help"
                      style={{ width: `${getPercent(helpedCount, exerciseCount)}%` }}
                    />
                    <span
                      className="bar-error"
                      style={{ width: `${getPercent(errorCount, exerciseCount)}%` }}
                    />
                  </div>
                  <strong>{getPercent(successCount + helpedCount, exerciseCount)}%</strong>
                </div>
              )
            })}
          </div>
          <div className="chart-legend">
            <span className="legend-success">Autonome</span>
            <span className="legend-help">Aide</span>
            <span className="legend-error">Erreur</span>
          </div>
        </div>

        <div className="chart-panel">
          <h3>Lettres connues</h3>
          <div className="known-chart">
            {recentSessions.map((session, index) => {
              const knownCount = session.summary.knownLetters.length
              const fragileCount = session.summary.fragileLetters.length

              return (
                <div className="known-chart-column" key={session.id}>
                  <div className="known-chart-track">
                    <span
                      className="known-chart-bar"
                      style={{ height: `${getPercent(knownCount, maxKnown)}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <strong>{knownCount}</strong>
                  <span>S{sessions.length - recentSessions.length + index + 1}</span>
                  {fragileCount > 0 && <small>{fragileCount} fragile</small>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Detail lisible d'une seance sauvegardee.
 */
function SessionDetail({ session }: { session: SessionRecord }) {
  return (
    <div className="session-detail">
      <div className="session-detail-summary">
        <span>{formatDate(session.startedAt)}</span>
        <span>{session.durationSeconds}s</span>
        <span>{session.summary.successes} réussites</span>
        <span>{session.summary.helpedCount} aides</span>
      </div>
      <div className="exercise-detail-list">
        {session.exercises.map((exercise, index) => (
          <div key={exercise.id} className="exercise-detail-row">
            <span>{index + 1}</span>
            <strong>{exercise.letter}</strong>
            <span>{getExerciseTypeLabel(exercise.type)}</span>
            <span>{exercise.attempts} essai(s)</span>
            <span>{exercise.helped ? 'Aide' : 'Autonome'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Compte les reponses ayant necessite plusieurs essais ou ayant echoue.
 */
function getSessionAttemptErrorCount(session: SessionRecord) {
  return session.exercises.reduce((total, exercise) => {
    const extraAttempts = Math.max(0, exercise.attempts - 1)

    return total + extraAttempts + (exercise.success ? 0 : 1)
  }, 0)
}

/**
 * Calcule un pourcentage entier borne entre 0 et 100.
 */
function getPercent(value: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round((value / total) * 100)))
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
  return exercise.type === 'twoChoice' || exercise.type === 'threeChoice'
}

/**
 * Recupere les lettres d'un statut donne dans l'ordre alphabetique.
 */
function getLettersByStatus(progress: AppProgress, status: LetterStatus) {
  return LETTER_ALPHABET.map((letter) => progress.letters[letter]).filter(
    (letterProgress): letterProgress is LetterProgress =>
      Boolean(letterProgress) && letterProgress.status === status,
  )
}

/**
 * Formate une date sauvegardee pour un affichage parent compact.
 */
function formatDate(value: string | undefined) {
  if (!value) {
    return 'Aucune'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

/**
 * Libelle parent d'un statut de lettre.
 */
function getStatusLabel(status: LetterStatus) {
  if (status === 'known') {
    return 'Connue'
  }

  if (status === 'fragile') {
    return 'Fragile'
  }

  if (status === 'learning') {
    return 'Apprentissage'
  }

  return 'Nouvelle'
}

/**
 * Libelle parent d'un type d'exercice.
 */
function getExerciseTypeLabel(type: ExerciseType | 'recognition' | 'choice' | 'discovery') {
  if (type === 'discovery') {
    return 'Association'
  }

  if (type === 'recognition') {
    return 'Choix 2 lettres'
  }

  if (type === 'choice') {
    return 'Choix 3 lettres'
  }

  return DEBUG_EXERCISE_LABELS[type]
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
  if (type === 'twoChoice') {
    return [letter, 'N']
  }

  if (type === 'threeChoice') {
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
  if (type === 'association') {
    return associationPrompt ?? `${letter} comme ${letter}`
  }

  if (type === 'naming') {
    return "Tu te rappelles comment elle s'appelle ?"
  }

  return `Montre-moi le ${letter}`
}

/**
 * Charge le choix local d'affichage des images. Par défaut, les images restent visibles.
 */
function loadShowImagesPreference() {
  if (typeof window === 'undefined') {
    return true
  }

  return window.localStorage.getItem(SHOW_IMAGES_STORAGE_KEY) !== 'false'
}

/**
 * Sauvegarde le choix local d'affichage des images.
 */
function saveShowImagesPreference(showImages: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(SHOW_IMAGES_STORAGE_KEY, showImages ? 'true' : 'false')
}

export default App
