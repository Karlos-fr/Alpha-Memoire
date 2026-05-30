/**
 * Point d'entrée navigateur d'Alpha-Mémoire.
 *
 * Monte l'application React dans le conteneur HTML généré par Vite.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
