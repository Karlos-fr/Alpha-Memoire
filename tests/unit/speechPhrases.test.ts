/**
 * Tests de la banque de phrases vocales.
 */

import { describe, expect, it } from 'vitest'
import {
  getRandomSpeechPhrase,
  SPEECH_PHRASES,
  type SpeechPhraseType,
} from '../../src/data/speechPhrases'

describe('speechPhrases', () => {
  it('keeps ten variants for every phrase type', () => {
    const phraseTypes = Object.keys(SPEECH_PHRASES) as SpeechPhraseType[]

    expect(phraseTypes).toEqual(['welcome', 'praise', 'help', 'sessionComplete'])

    phraseTypes.forEach((type) => {
      expect(SPEECH_PHRASES[type]).toHaveLength(10)
      expect(new Set(SPEECH_PHRASES[type]).size).toBe(10)
    })
  })

  it('selects a phrase with the injected random source', () => {
    expect(getRandomSpeechPhrase('praise', () => 0)).toBe(SPEECH_PHRASES.praise[0])
    expect(getRandomSpeechPhrase('praise', () => 0.99)).toBe(
      SPEECH_PHRASES.praise[9],
    )
  })
})
