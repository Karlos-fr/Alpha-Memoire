/**
 * Tests navigateur du stockage local.
 *
 * Vérifie que la progression est créée au premier chargement et conservée
 * après rechargement de page.
 */

import { expect, test } from '@playwright/test'
import { PROGRESS_STORAGE_KEY } from '../src/lib/appConfig'

/**
 * Valide l'initialisation automatique et la persistance de la progression.
 */
test('initializes and keeps progress in localStorage', async ({ page }) => {
  await page.goto('/')

  const firstValue = await page.evaluate((storageKey) => {
    return window.localStorage.getItem(storageKey)
  }, PROGRESS_STORAGE_KEY)

  expect(firstValue).not.toBeNull()

  const firstProgress = JSON.parse(firstValue ?? '{}') as {
    childName?: string
    activeLetters?: string[]
    sessions?: unknown[]
  }

  expect(firstProgress.childName).toBe('Nathan')
  expect(firstProgress.activeLetters).toEqual(['N', 'A', 'T', 'H'])
  expect(firstProgress.sessions).toEqual([])

  await page.goto('/')

  const secondValue = await page.evaluate((storageKey) => {
    return window.localStorage.getItem(storageKey)
  }, PROGRESS_STORAGE_KEY)

  expect(secondValue).toBe(firstValue)
})
