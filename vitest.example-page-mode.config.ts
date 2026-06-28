import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/example-page-mode.test.mjs'],
    pool: 'forks',
    testTimeout: 90000,
  },
})
