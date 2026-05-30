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
  pitch: number
}

/**
 * Réglages doux par défaut pour une voix destinée à Nathan.
 */
export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  volume: 1,
  rate: 0.82,
  pitch: 1.04,
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
    pitch: clampSpeechValue(settings.pitch ?? DEFAULT_SPEECH_SETTINGS.pitch, 0.8, 1.2),
  }
}

/**
 * Sélectionne prioritairement une voix française disponible.
 */
export function selectFrenchVoice(voices: SpeechSynthesisVoice[]) {
  const frenchVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('fr'))

  if (frenchVoices.length === 0) {
    return null
  }

  return [...frenchVoices].sort(compareVoiceQuality)[0]
}

/**
 * Classe les voix en privilégiant les moteurs plus naturels.
 */
function compareVoiceQuality(left: SpeechSynthesisVoice, right: SpeechSynthesisVoice) {
  return getVoiceScore(right) - getVoiceScore(left)
}

/**
 * Donne un score empirique à une voix disponible dans le navigateur.
 */
function getVoiceScore(voice: SpeechSynthesisVoice) {
  const normalizedName = voice.name.toLowerCase()
  let score = 0

  if (voice.lang === 'fr-FR') {
    score += 20
  }

  if (normalizedName.includes('natural')) {
    score += 12
  }

  if (normalizedName.includes('online')) {
    score += 10
  }

  if (normalizedName.includes('neural')) {
    score += 10
  }

  if (normalizedName.includes('premium')) {
    score += 8
  }

  if (normalizedName.includes('google')) {
    score += 6
  }

  if (normalizedName.includes('microsoft')) {
    score += 4
  }

  if (voice.localService) {
    score -= 2
  }

  return score
}
