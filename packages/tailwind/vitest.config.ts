import path from 'node:path'

import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'

import baseConfig from './vite.base.config'

export default mergeConfig(baseConfig, defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@iconcat/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@iconcat/tailwind': path.resolve(__dirname, 'src/plugin.ts'),
      'tailwindcss-plugin-iconify': path.resolve(__dirname, 'src/plugin.ts'),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
}))
