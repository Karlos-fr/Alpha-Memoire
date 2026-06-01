/**
 * Phrases vocales variables utilisees par l'experience enfant.
 *
 * Chaque groupe garde exactement dix formulations courtes pour limiter la
 * repetition tout en conservant des consignes simples pour Nathan.
 */

/**
 * Intentions vocales variables dans l'interface enfant.
 */
export type SpeechPhraseType = 'welcome' | 'praise' | 'help' | 'sessionComplete'

/**
 * Banque de phrases vocales par intention.
 */
export const SPEECH_PHRASES = {
  welcome: [
    'Bonjour Nathan. Pret pour la mission des lettres ?',
    'Coucou Nathan. On part chercher des lettres ?',
    'Salut Nathan. La mission des lettres commence quand tu veux.',
    'Bonjour Nathan. Ton compagnon est pret pour apprendre avec toi.',
    'Coucou Nathan. Aujourd hui, on ecoute les lettres ensemble.',
    'Salut Nathan. Pret a reconnaitre quelques lettres ?',
    'Bonjour Nathan. On avance doucement, lettre apres lettre.',
    'Coucou Nathan. Une petite mission de lettres nous attend.',
    'Salut Nathan. Tu peux commencer quand tu es pret.',
    'Bonjour Nathan. On va s entrainer tranquillement.',
  ],
  praise: [
    'Bravo Nathan !',
    'Super Nathan !',
    'Bien joue Nathan !',
    'Genial Nathan !',
    'Tu progresses Nathan !',
    'Tres bien Nathan !',
    'Belle reponse Nathan !',
    'Continue comme ca Nathan !',
    'Tu as bien ecoute Nathan !',
    'Mission reussie Nathan !',
  ],
  help: [
    'Presque Nathan. Regarde avec moi.',
    'On essaie encore Nathan.',
    'Je vais t aider Nathan.',
    'Regardons ensemble Nathan.',
    'Tu y es presque Nathan.',
    'On reprend doucement Nathan.',
    'Ecoute encore une fois Nathan.',
    'Pas de souci Nathan, on continue.',
    'Je te montre Nathan.',
    'On cherche ensemble Nathan.',
  ],
  sessionComplete: [
    'Bravo Nathan, mission terminee.',
    'Super Nathan, la seance est finie.',
    'Bien joue Nathan, tu as termine la mission.',
    'Genial Nathan, tu as bien travaille.',
    'Bravo Nathan, tu as avance avec les lettres.',
    'Tres bien Nathan, la mission est reussie.',
    'Mission terminee Nathan, beau travail.',
    'Tu as fini Nathan, bravo pour tes efforts.',
    'La seance est terminee Nathan, tu peux souffler.',
    'Bravo Nathan, on garde tout ce que tu as fait.',
  ],
} as const satisfies Record<SpeechPhraseType, readonly string[]>

/**
 * Tire une phrase aleatoire dans le groupe demande.
 */
export function getRandomSpeechPhrase(
  type: SpeechPhraseType,
  random: () => number = Math.random,
) {
  const phrases = SPEECH_PHRASES[type]
  const index = Math.floor(random() * phrases.length)

  return phrases[index]
}
