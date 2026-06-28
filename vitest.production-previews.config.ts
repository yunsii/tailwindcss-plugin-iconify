import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/production-previews.test.mjs'],
    pool: 'forks',
    testTimeout: 60000,
  },
})
