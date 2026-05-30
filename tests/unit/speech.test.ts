/**
 * Tests unitaires des utilitaires de synthèse vocale.
 *
 * Couvre la sélection d'une voix française et la normalisation des réglages.
 */

import { describe, expect, it } from 'vitest'
import { normalizeSpeechSettings, selectFrenchVoice } from '../../src/lib/speech'

/**
 * Crée une voix minimale pour tester la sélection.
 */
function createVoice(name: string, lang: string) {
  return { name, lang } as SpeechSynthesisVoice
}

describe('speech utilities', () => {
  it('selects a fr-FR voice first', () => {
    const voice = selectFrenchVoice([
      createVoice('French Canada', 'fr-CA'),
      createVoice('English', 'en-US'),
      createVoice('French France', 'fr-FR'),
    ])

    expect(voice?.name).toBe('French France')
  })

  it('falls back to another French voice', () => {
    const voice = selectFrenchVoice([
      createVoice('English', 'en-US'),
      createVoice('French Belgium', 'fr-BE'),
    ])

    expect(voice?.name).toBe('French Belgium')
  })

  it('returns null when no French voice exists', () => {
    const voice = selectFrenchVoice([createVoice('English', 'en-US')])

    expect(voice).toBeNull()
  })

  it('prefers natural French voices when available', () => {
    const voice = selectFrenchVoice([
      createVoice('Microsoft Hortense', 'fr-FR'),
      createVoice('Microsoft Denise Natural Online', 'fr-FR'),
    ])

    expect(voice?.name).toBe('Microsoft Denise Natural Online')
  })

  it('keeps speech settings inside safe bounds', () => {
    expect(normalizeSpeechSettings({ volume: 2, rate: 2, pitch: 2 })).toEqual({
      volume: 1,
      rate: 1.2,
      pitch: 1.2,
    })
    expect(normalizeSpeechSettings({ volume: -1, rate: 0.2, pitch: 0.2 })).toEqual({
      volume: 0,
      rate: 0.5,
      pitch: 0.8,
    })
  })
})
