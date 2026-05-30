/**
 * Composant racine de l'application Alpha-Mémoire.
 *
 * Pour l'instant, il expose le premier écran de lancement et le groupe initial
 * de lettres. Les prochaines phases brancheront les séances et l'espace parent.
 */

import './App.css'
import { CHILD_NAME, INITIAL_ACTIVE_LETTERS } from './lib/appConfig'

/**
 * Affiche l'écran d'accueil principal.
 */
function App() {
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

        <div className="letter-preview" aria-label="Premier groupe de lettres">
          {INITIAL_ACTIVE_LETTERS.map((letter) => (
            <span key={letter}>{letter}</span>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
