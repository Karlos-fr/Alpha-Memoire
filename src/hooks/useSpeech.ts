/**
 * Hook React pour la synthèse vocale navigateur.
 *
 * Fournit une API simple pour lire, arrêter et relire les consignes avec une
 * voix française lorsque le navigateur en propose une.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_SPEECH_SETTINGS,
  normalizeSpeechSettings,
  selectFrenchVoice,
  type SpeechSettings,
} from '../lib/speech'

/**
 * Options de configuration du hook vocal.
 */
export interface UseSpeechOptions {
  defaultText?: string
  settings?: Partial<SpeechSettings>
}

/**
 * État et commandes exposés aux composants.
 */
export interface UseSpeechResult {
  isSupported: boolean
  isSpeaking: boolean
  voicesLoaded: boolean
  voice: SpeechSynthesisVoice | null
  settings: SpeechSettings
  speak: (text?: string) => boolean
  stopSpeaking: () => void
  setVolume: (volume: number) => void
  setRate: (rate: number) => void
  setPitch: (pitch: number) => void
}

/**
 * Prépare et contrôle la synthèse vocale du navigateur.
 */
export function useSpeech(options: UseSpeechOptions = {}): UseSpeechResult {
  const defaultText = options.defaultText ?? ''
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [settings, setSettings] = useState(() =>
    normalizeSpeechSettings(options.settings ?? DEFAULT_SPEECH_SETTINGS),
  )
  const lastTextRef = useRef(defaultText)

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const voice = useMemo(() => selectFrenchVoice(voices), [voices])

  useEffect(() => {
    if (!isSupported) {
      return
    }

    const speechSynthesis = window.speechSynthesis
    const loadVoices = () => {
      setVoices(speechSynthesis.getVoices())
      setVoicesLoaded(true)
    }

    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [isSupported])

  useEffect(() => {
    lastTextRef.current = defaultText
  }, [defaultText])

  const stopSpeaking = useCallback(() => {
    if (!isSupported) {
      return
    }

    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [isSupported])

  const speak = useCallback(
    (text = lastTextRef.current) => {
      if (!isSupported || text.trim().length === 0) {
        return false
      }

      lastTextRef.current = text
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = voice?.lang ?? 'fr-FR'
      utterance.voice = voice
      utterance.volume = settings.volume
      utterance.rate = settings.rate
      utterance.pitch = settings.pitch
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
      return true
    },
    [isSupported, settings.pitch, settings.rate, settings.volume, voice],
  )

  const setVolume = useCallback((volume: number) => {
    setSettings((currentSettings) =>
      normalizeSpeechSettings({ ...currentSettings, volume }),
    )
  }, [])

  const setRate = useCallback((rate: number) => {
    setSettings((currentSettings) => normalizeSpeechSettings({ ...currentSettings, rate }))
  }, [])

  const setPitch = useCallback((pitch: number) => {
    setSettings((currentSettings) => normalizeSpeechSettings({ ...currentSettings, pitch }))
  }, [])

  return useMemo(
    () => ({
      isSupported,
      isSpeaking,
      voicesLoaded,
      voice,
      settings,
      speak,
      stopSpeaking,
      setVolume,
      setRate,
      setPitch,
    }),
    [
      isSpeaking,
      isSupported,
      setPitch,
      setRate,
      setVolume,
      settings,
      speak,
      stopSpeaking,
      voice,
      voicesLoaded,
    ],
  )
}
