import path from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@iconcat/adapter-utils/next-app-router': path.resolve(__dirname, '../adapter-utils/src/next-app-router.ts'),
      '@iconcat/adapter-utils': path.resolve(__dirname, '../adapter-utils/src/index.ts'),
      '@iconcat/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@iconcat/extractor': path.resolve(__dirname, '../extractor/src/index.ts'),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
})
