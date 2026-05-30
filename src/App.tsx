import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="app-title">
        <div className="mission-panel">
          <p className="eyebrow">Mission lettres</p>
          <h1 id="app-title">Alpha-Mémoire</h1>
          <p className="intro">
            Un espace doux pour aider Nathan à reconnaître les lettres, les
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
          <span>N</span>
          <span>A</span>
          <span>T</span>
          <span>H</span>
        </div>
      </section>
    </main>
  )
}

export default App
