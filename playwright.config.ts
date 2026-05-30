/**
 * Configuration des tests navigateur Alpha-Mémoire.
 *
 * Les tests Playwright valident les comportements qui dépendent réellement du
 * navigateur, comme `localStorage`.
 */

import { defineConfig } from '@playwright/test'

/**
 * Configuration partagée des tests end-to-end.
 */
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:5173',
  },
})
