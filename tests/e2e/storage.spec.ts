/**
 * Tests navigateur du stockage local.
 *
 * Vérifie que la progression est créée au premier chargement et conservée
 * après une nouvelle navigation.
 */

import { expect, test } from '@playwright/test'
import { PROGRESS_STORAGE_KEY } from '../../src/lib/appConfig'

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

/**
 * Valide l'enregistrement detaille d'une seance terminee.
 */
test('records a completed session with exercise details', async ({ page }) => {
  test.setTimeout(60000)

  await page.goto('/')
  await page.locator('.primary-action').first().click()

  for (let step = 0; step < 12; step += 1) {
    if (await page.getByRole('heading', { name: /Bravo Nathan/ }).isVisible()) {
      break
    }

    const continueButton = page.getByRole('button', { name: 'Continuer' })
    const namingButton = page.getByRole('button', { name: 'Il a trouvÃ©' })

    if (await continueButton.isVisible()) {
      await continueButton.click()
      await page.waitForTimeout(2200)
      continue
    }

    if (await namingButton.isVisible()) {
      await namingButton.click()
      await page.waitForTimeout(2200)
      continue
    }

    await page.locator('.choice-button').first().click()

    const helpedChoice = page.locator('.choice-button.is-helped')
    if (await helpedChoice.isVisible()) {
      await helpedChoice.click()
    }

    await page.waitForTimeout(2200)
  }

  await expect(page.getByRole('heading', { name: /Bravo Nathan/ })).toBeVisible()

  const storedValue = await page.evaluate((storageKey) => {
    return window.localStorage.getItem(storageKey)
  }, PROGRESS_STORAGE_KEY)
  const progress = JSON.parse(storedValue ?? '{}') as {
    sessions?: Array<{
      id?: string
      startedAt?: string
      endedAt?: string
      durationSeconds?: number
      exercises?: Array<{
        id?: string
        type?: string
        letter?: string
        choices?: string[]
        success?: boolean
        attempts?: number
        helped?: boolean
        startedAt?: string
        completedAt?: string
      }>
      summary?: {
        successes?: number
        errors?: number
        helpedCount?: number
        lettersPracticed?: string[]
      }
    }>
  }
  const session = progress.sessions?.[0]
  const firstExercise = session?.exercises?.[0]

  expect(session?.id).toMatch(/^session-plan-/)
  expect(Date.parse(session?.startedAt ?? '')).not.toBeNaN()
  expect(Date.parse(session?.endedAt ?? '')).not.toBeNaN()
  expect(session?.durationSeconds).toBeGreaterThan(0)
  expect(session?.exercises?.length).toBeGreaterThanOrEqual(8)
  expect(firstExercise?.id).toBeTruthy()
  expect(firstExercise?.type).toBeTruthy()
  expect(firstExercise?.letter).toMatch(/^[A-Z]$/)
  expect(firstExercise?.choices?.length).toBeGreaterThan(0)
  expect(firstExercise?.success).toBe(true)
  expect(firstExercise?.attempts).toBeGreaterThan(0)
  expect(typeof firstExercise?.helped).toBe('boolean')
  expect(Date.parse(firstExercise?.startedAt ?? '')).not.toBeNaN()
  expect(Date.parse(firstExercise?.completedAt ?? '')).not.toBeNaN()
  expect(session?.summary?.successes).toBeGreaterThan(0)
  expect(session?.summary?.errors).toBe(0)
  expect(session?.summary?.lettersPracticed?.length).toBeGreaterThan(0)
})
