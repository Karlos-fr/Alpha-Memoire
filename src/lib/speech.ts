/**
 * Utilitaires de synthèse vocale.
 *
 * Regroupe la logique pure autour du choix de voix et des réglages audio, afin
 * que le hook navigateur reste simple.
 */

/**
 * Réglages utilisés pour lire une consigne.
 */
export interface SpeechSettings {
  volume: number
  rate: number
}

/**
 * Réglages doux par défaut pour une voix destinée à Nathan.
 */
export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  volume: 1,
  rate: 0.86,
}

/**
 * Garde une valeur numérique entre deux bornes.
 */
export function clampSpeechValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Normalise les réglages de lecture avant de les appliquer au navigateur.
 */
export function normalizeSpeechSettings(settings: Partial<SpeechSettings>): SpeechSettings {
  return {
    volume: clampSpeechValue(settings.volume ?? DEFAULT_SPEECH_SETTINGS.volume, 0, 1),
    rate: clampSpeechValue(settings.rate ?? DEFAULT_SPEECH_SETTINGS.rate, 0.5, 1.2),
  }
}

/**
 * Sélectionne prioritairement une voix française disponible.
 */
export function selectFrenchVoice(voices: SpeechSynthesisVoice[]) {
  return (
    voices.find((voice) => voice.lang === 'fr-FR') ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('fr')) ??
    null
  )
}
