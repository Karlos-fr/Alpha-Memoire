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
      await page.waitForTimeout(850)
      continue
    }

    if (await namingButton.isVisible()) {
      await namingButton.click()
      await page.waitForTimeout(850)
      continue
    }

    const letter = (await page.locator('.exercise-letter').textContent())?.trim()
    expect(letter).toBeTruthy()

    await page.getByRole('button', { name: letter }).first().click()
    await page.waitForTimeout(850)
  }

  await expect(page.getByRole('heading', { name: /Bravo Nathan/ })).toBeVisible()
})
