/**
 * Données statiques des lettres Alpha-Mémoire.
 *
 * Ce fichier centralise les mots, phrases audio et visuels temporaires utilisés
 * pour construire les exercices.
 */

import type { LetterCard, LetterSymbol } from '../types'

/**
 * Alphabet français en majuscules, utilisé comme ordre de référence.
 */
export const LETTER_ALPHABET = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
] as const satisfies readonly LetterSymbol[]

/**
 * Lettre appartenant à l'alphabet complet suivi par l'application.
 */
export type AlphabetLetter = (typeof LETTER_ALPHABET)[number]

/**
 * Cartes de lettres disponibles dans la base de données locale.
 */
export const LETTER_CARDS = {
  A: {
    letter: 'A',
    word: 'Avion',
    audioText: 'A comme Avion',
    temporaryVisual: 'A',
    image: {
      src: '',
      alt: "Illustration temporaire d'un avion",
    },
  },
  B: {
    letter: 'B',
    word: 'Ballon',
    audioText: 'B comme Ballon',
    temporaryVisual: 'B',
    image: {
      src: '',
      alt: "Illustration temporaire d'un ballon",
    },
  },
  C: {
    letter: 'C',
    word: 'Chat',
    audioText: 'C comme Chat',
    temporaryVisual: 'C',
    image: {
      src: '',
      alt: "Illustration temporaire d'un chat",
    },
  },
  D: {
    letter: 'D',
    word: 'Doudou',
    audioText: 'D comme Doudou',
    temporaryVisual: 'D',
    image: {
      src: '',
      alt: "Illustration temporaire d'un doudou",
    },
  },
  E: {
    letter: 'E',
    word: 'Éléphant',
    audioText: 'E comme Éléphant',
    temporaryVisual: 'E',
    image: {
      src: '',
      alt: "Illustration temporaire d'un éléphant",
    },
  },
  F: {
    letter: 'F',
    word: 'Fleur',
    audioText: 'F comme Fleur',
    temporaryVisual: 'F',
    image: {
      src: '',
      alt: "Illustration temporaire d'une fleur",
    },
  },
  G: {
    letter: 'G',
    word: 'Gâteau',
    audioText: 'G comme Gâteau',
    temporaryVisual: 'G',
    image: {
      src: '',
      alt: "Illustration temporaire d'un gâteau",
    },
  },
  H: {
    letter: 'H',
    word: 'Hérisson',
    audioText: 'H comme Hérisson',
    temporaryVisual: 'H',
    image: {
      src: '',
      alt: "Illustration temporaire d'un hérisson",
    },
  },
  I: {
    letter: 'I',
    word: 'Île',
    audioText: 'I comme Île',
    temporaryVisual: 'I',
    image: {
      src: '',
      alt: "Illustration temporaire d'une île",
    },
  },
  J: {
    letter: 'J',
    word: 'Jouet',
    audioText: 'J comme Jouet',
    temporaryVisual: 'J',
    image: {
      src: '',
      alt: "Illustration temporaire d'un jouet",
    },
  },
  K: {
    letter: 'K',
    word: 'Koala',
    audioText: 'K comme Koala',
    temporaryVisual: 'K',
    image: {
      src: '',
      alt: "Illustration temporaire d'un koala",
    },
  },
  L: {
    letter: 'L',
    word: 'Lune',
    audioText: 'L comme Lune',
    temporaryVisual: 'L',
    image: {
      src: '',
      alt: "Illustration temporaire de la lune",
    },
  },
  M: {
    letter: 'M',
    word: 'Maman',
    audioText: 'M comme Maman',
    temporaryVisual: 'M',
    image: {
      src: '',
      alt: 'Illustration temporaire du mot maman',
    },
  },
  N: {
    letter: 'N',
    word: 'Nathan',
    audioText: 'N comme Nathan',
    temporaryVisual: 'N',
    image: {
      src: '',
      alt: 'Illustration temporaire du prénom Nathan',
    },
  },
  O: {
    letter: 'O',
    word: 'Ours',
    audioText: 'O comme Ours',
    temporaryVisual: 'O',
    image: {
      src: '',
      alt: "Illustration temporaire d'un ours",
    },
  },
  P: {
    letter: 'P',
    word: 'Papa',
    audioText: 'P comme Papa',
    temporaryVisual: 'P',
    image: {
      src: '',
      alt: 'Illustration temporaire du mot papa',
    },
  },
  Q: {
    letter: 'Q',
    word: 'Quatre',
    audioText: 'Q comme Quatre',
    temporaryVisual: 'Q',
    image: {
      src: '',
      alt: 'Illustration temporaire du chiffre quatre',
    },
  },
  R: {
    letter: 'R',
    word: 'Robot',
    audioText: 'R comme Robot',
    temporaryVisual: 'R',
    image: {
      src: '',
      alt: "Illustration temporaire d'un robot",
    },
  },
  S: {
    letter: 'S',
    word: 'Serpent',
    audioText: 'S comme Serpent',
    temporaryVisual: 'S',
    image: {
      src: '',
      alt: "Illustration temporaire d'un serpent",
    },
  },
  T: {
    letter: 'T',
    word: 'Train',
    audioText: 'T comme Train',
    temporaryVisual: 'T',
    image: {
      src: '',
      alt: "Illustration temporaire d'un train",
    },
  },
  U: {
    letter: 'U',
    word: 'Usine',
    audioText: 'U comme Usine',
    temporaryVisual: 'U',
    image: {
      src: '',
      alt: "Illustration temporaire d'une usine",
    },
  },
  V: {
    letter: 'V',
    word: 'Vélo',
    audioText: 'V comme Vélo',
    temporaryVisual: 'V',
    image: {
      src: '',
      alt: "Illustration temporaire d'un vélo",
    },
  },
  W: {
    letter: 'W',
    word: 'Wagon',
    audioText: 'W comme Wagon',
    temporaryVisual: 'W',
    image: {
      src: '',
      alt: "Illustration temporaire d'un wagon",
    },
  },
  X: {
    letter: 'X',
    word: 'Xylophone',
    audioText: 'X comme Xylophone',
    temporaryVisual: 'X',
    image: {
      src: '',
      alt: "Illustration temporaire d'un xylophone",
    },
  },
  Y: {
    letter: 'Y',
    word: 'Yaourt',
    audioText: 'Y comme Yaourt',
    temporaryVisual: 'Y',
    image: {
      src: '',
      alt: "Illustration temporaire d'un yaourt",
    },
  },
  Z: {
    letter: 'Z',
    word: 'Zèbre',
    audioText: 'Z comme Zèbre',
    temporaryVisual: 'Z',
    image: {
      src: '',
      alt: "Illustration temporaire d'un zèbre",
    },
  },
} as const satisfies Record<AlphabetLetter, LetterCard>

/**
 * Lettre disposant actuellement d'une carte complète dans l'application.
 */
export type AvailableLetter = keyof typeof LETTER_CARDS

/**
 * Lettres du premier groupe travaillé avec Nathan.
 */
export const INITIAL_LETTER_ORDER = [
  'N',
  'A',
  'T',
  'H',
] as const satisfies readonly AvailableLetter[]

/**
 * Cartes du premier groupe, dans l'ordre de présentation prévu.
 */
export const INITIAL_LETTER_CARDS = INITIAL_LETTER_ORDER.map(
  (letter) => LETTER_CARDS[letter],
)

/**
 * Récupère une carte de lettre lorsqu'elle existe dans les données courantes.
 */
export function getLetterCard(letter: LetterSymbol): LetterCard | undefined {
  if (letter in LETTER_CARDS) {
    return LETTER_CARDS[letter as AvailableLetter]
  }

  return undefined
}
