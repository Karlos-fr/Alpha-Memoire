/**
 * Tests navigateur du stockage local.
 *
 * Vérifie que la progression est créée au premier chargement et conservée
 * après une nouvelle navigation.
 */

import { expect, test } from '@playwright/test'
import { PROGRESS_STORAGE_KEY } from '../../src/lib/appConfig'
import { createInitialProgress } from '../../src/lib/progressStorage'

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
    const namingButton = page.getByRole('button', { name: 'Il a trouvé' })

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

/**
 * Verifie les informations principales du tableau de bord parent.
 */
test('shows parent dashboard with history details and reset action', async ({ page }) => {
  const seededProgress = createInitialProgress('2026-05-30T10:00:00.000Z')

  seededProgress.letters.N = {
    ...seededProgress.letters.N,
    status: 'known',
    seenCount: 4,
    successCount: 4,
    successWithoutHelpCount: 4,
  }
  seededProgress.letters.A = {
    ...seededProgress.letters.A,
    status: 'learning',
    seenCount: 2,
    successCount: 1,
    successWithoutHelpCount: 1,
  }
  seededProgress.letters.T = {
    ...seededProgress.letters.T,
    status: 'fragile',
    seenCount: 3,
    errorCount: 2,
  }
  seededProgress.sessions = [
    {
      id: 'session-plan-test',
      startedAt: '2026-05-30T10:00:00.000Z',
      endedAt: '2026-05-30T10:06:00.000Z',
      durationSeconds: 360,
      exercises: [
        {
          id: 'session-plan-test-exercise-1',
          type: 'threeChoice',
          letter: 'N',
          choices: ['N', 'A', 'T'],
          scored: true,
          success: true,
          attempts: 1,
          helped: false,
          parentValidated: false,
          startedAt: '2026-05-30T10:00:00.000Z',
          completedAt: '2026-05-30T10:00:15.000Z',
        },
      ],
      summary: {
        successes: 1,
        errors: 0,
        helpedCount: 0,
        lettersPracticed: ['N'],
        fragileLetters: ['T'],
        knownLetters: ['N'],
      },
    },
  ]

  await page.goto('/')
  await page.evaluate(
    ([storageKey, progressJson]) => {
      window.localStorage.setItem(storageKey, progressJson)
    },
    [PROGRESS_STORAGE_KEY, JSON.stringify(seededProgress)],
  )
  await page.reload()
  await page.locator('.actions .secondary-action').click()

  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
  await expect(page.getByText('Séances', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Évolution' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Résultats par séance' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Lettres connues' })).toBeVisible()
  await expect(page.getByText('Séance 1')).toBeVisible()
  await expect(page.getByText('Détail de séance')).toBeVisible()
  await expect(page.getByText('360s', { exact: true })).toBeVisible()
  await expect(page.getByText('Connue', { exact: true })).toBeVisible()
  await expect(page.getByText('Apprentissage', { exact: true })).toBeVisible()
  await expect(page.getByText('Fragile', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export JSON' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Import JSON' })).toBeVisible()

  page.once('dialog', async (dialog) => {
    await dialog.accept()
  })
  await page.getByRole('button', { name: 'Réinitialiser' }).click()
  await expect(page.getByText('Progression réinitialisée.')).toBeVisible()
  await expect(page.getByText('Aucune séance terminée pour le moment.')).toBeVisible()
})
