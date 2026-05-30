import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Configuration Vite de l'application Alpha-Mémoire.
 */
export default defineConfig({
  base: '/Alpha-M-moire/',
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
})
