/**
 * Composant racine de l'application Alpha-Mémoire.
 *
 * Pour l'instant, il expose le premier écran de lancement et le groupe initial
 * de lettres. Les prochaines phases brancheront les séances et l'espace parent.
 */

import './App.css'
import { useEffect, useRef } from 'react'
import { INITIAL_LETTER_CARDS } from './data/letters'
import { useSpeech } from './hooks/useSpeech'
import { CHILD_NAME, INITIAL_ACTIVE_LETTERS } from './lib/appConfig'
import { ensureStoredProgress } from './lib/progressStorage'

/**
 * Affiche l'écran d'accueil principal.
 */
function App() {
  const hasTriedAutoSpeech = useRef(false)
  const welcomeInstruction = `Bonjour ${CHILD_NAME}. Prêt pour la mission des lettres ?`
  const speech = useSpeech({
    defaultText: welcomeInstruction,
  })

  useEffect(() => {
    ensureStoredProgress()
  }, [])

  useEffect(() => {
    if (hasTriedAutoSpeech.current) {
      return
    }

    hasTriedAutoSpeech.current = true
    speech.speak(welcomeInstruction)
  }, [speech, welcomeInstruction])

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="app-title">
        <div className="mission-panel">
          <p className="eyebrow">Mission lettres</p>
          <h1 id="app-title">Alpha-Mémoire</h1>
          <p className="intro">
            Un espace doux pour aider {CHILD_NAME} à reconnaître les lettres, les
            entendre et les nommer séance après séance.
          </p>
          <div className="actions" aria-label="Actions principales">
            <button type="button" className="primary-action">
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
}

export default App
