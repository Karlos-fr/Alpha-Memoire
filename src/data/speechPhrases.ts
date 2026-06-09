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
    'Bonjour Nathan. Prêt pour la mission des lettres ?',
    'Coucou Nathan. On part chercher des lettres ?',
    'Salut Nathan. La mission des lettres commence quand tu veux.',
    'Bonjour Nathan. Ton compagnon est prêt pour apprendre avec toi.',
    "Coucou Nathan. Aujourd'hui, on écoute les lettres ensemble.",
    'Salut Nathan. Prêt à reconnaître quelques lettres ?',
    'Bonjour Nathan. On avance doucement, lettre après lettre.',
    'Coucou Nathan. Une petite mission de lettres nous attend.',
    'Salut Nathan. Tu peux commencer quand tu es prêt.',
    "Bonjour Nathan. On va s'entraîner tranquillement.",
  ],
  praise: [
    'Bravo Nathan !',
    'Super Nathan !',
    'Bien joué Nathan !',
    'Génial Nathan !',
    'Tu progresses Nathan !',
    'Très bien Nathan !',
    'Belle réponse Nathan !',
    'Continue comme ça Nathan !',
    'Tu as bien écouté Nathan !',
    'Mission réussie Nathan !',
  ],
  help: [
    'Presque Nathan. Regarde avec moi.',
    'On essaie encore Nathan.',
    "Je vais t'aider Nathan.",
    'Regardons ensemble Nathan.',
    'Tu y es presque Nathan.',
    'On reprend doucement Nathan.',
    'Écoute encore une fois Nathan.',
    'Pas de souci Nathan, on continue.',
    'Je te montre Nathan.',
    'On cherche ensemble Nathan.',
  ],
  sessionComplete: [
    'Bravo Nathan, mission terminée.',
    'Super Nathan, la séance est finie.',
    'Bien joué Nathan, tu as terminé la mission.',
    'Génial Nathan, tu as bien travaillé.',
    'Bravo Nathan, tu as avancé avec les lettres.',
    'Très bien Nathan, la mission est réussie.',
    'Mission terminée Nathan, beau travail.',
    'Tu as fini Nathan, bravo pour tes efforts.',
    'La séance est terminée Nathan, tu peux souffler.',
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
