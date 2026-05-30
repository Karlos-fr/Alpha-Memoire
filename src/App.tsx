/**
 * Composant racine de l'application Alpha-Mémoire.
 *
 * Pour l'instant, il expose le premier écran de lancement et le groupe initial
 * de lettres. Les prochaines phases brancheront les séances et l'espace parent.
 */

import './App.css'
import { useEffect } from 'react'
import { INITIAL_LETTER_CARDS } from './data/letters'
import { CHILD_NAME, INITIAL_ACTIVE_LETTERS } from './lib/appConfig'
import { ensureStoredProgress } from './lib/progressStorage'

/**
 * Affiche l'écran d'accueil principal.
 */
function App() {
  useEffect(() => {
    ensureStoredProgress()
  }, [])

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
          </div>
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
