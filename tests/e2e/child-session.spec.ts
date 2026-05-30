/**
 * Test navigateur de l'expérience enfant.
 *
 * Démarre une séance et répond correctement jusqu'à l'écran de fin.
 */

import { expect, test } from '@playwright/test'

/**
 * Vérifie qu'une séance enfant peut être terminée sans blocage.
 */
test('completes a child session with positive flow', async ({ page }) => {
  test.setTimeout(60000)

  await page.goto('/')
  await page.getByRole('button', { name: 'Démarrer une séance' }).click()

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
})

/**
 * Vérifie que la consigne visuelle ne donne pas la réponse.
 */
test('hides target letter from visual recognition prompt', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Démarrer une séance' }).click()

  const visualPrompt = (await page.locator('.exercise-stage .spoken-instruction').textContent())
    ?.trim()

  expect(visualPrompt).toBe('\u00C9coute puis choisis la bonne lettre.')
  await expect(page.locator('.exercise-stage .exercise-letter')).toHaveCount(0)
  await expect(page.locator('.exercise-stage .letter-word')).toHaveCount(0)
  await expect(page.locator('.exercise-stage .letter-image-prompt')).toBeVisible()
})

/**
 * Verifie que le compteur avance seulement quand la carte suivante est affichee.
 */
test('keeps session counter on current card during feedback transition', async ({ page }) => {
  await page.goto('/')
  await page.locator('.primary-action').first().click()

  const initialCounter = (await page.locator('.session-count').textContent())?.trim()
  const imageSource = await page.locator('.letter-image-prompt').getAttribute('src')
  const targetLetter = imageSource?.match(/letter-([a-z])-/)?.[1]?.toUpperCase()

  expect(initialCounter).toMatch(/^1 \/ \d+$/)
  expect(targetLetter).toBeTruthy()

  await page.getByRole('button', { name: targetLetter, exact: true }).click()

  await expect(page.locator('.session-count')).toHaveText(initialCounter ?? '')
})

/**
 * Verifie que le panneau debug ouvre un mode d'exercice isole.
 */
test('starts a debug exercise mode from home', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Choix' }).click()

  await expect(page.getByText('Debug')).toBeVisible()
  await expect(page.locator('.exercise-stage .letter-image-prompt')).toBeVisible()
  await expect(page.locator('.choice-button')).toHaveCount(3)
})
