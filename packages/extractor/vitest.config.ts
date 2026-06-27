import path from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@iconcat/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@iconcat/presets': path.resolve(__dirname, '../presets/src/index.ts'),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    benchmark: {
      include: ['bench/**/*.bench.ts'],
    },
  },
})
