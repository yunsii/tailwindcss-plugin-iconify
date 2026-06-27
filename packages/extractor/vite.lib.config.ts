import path from 'node:path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

import pkg from './package.json'

const externalPackages = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]

const regexpsOfPackages = externalPackages.map(
  (packageName) => new RegExp(`^${packageName}(/.*)?`),
)

export default defineConfig({
  resolve: {
    alias: {
      '@iconcat/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@iconcat/presets': path.resolve(__dirname, '../presets/src/index.ts'),
    },
  },
  plugins: [dts()],
  build: {
    minify: false,
    lib: {
      entry: [
        path.resolve(__dirname, 'src/index.ts'),
        path.resolve(__dirname, 'src/vite.ts'),
      ],
    },
    rollupOptions: {
      output: [
        {
          dir: 'dist',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].mjs',
          format: 'es',
          dynamicImportInCjs: true,
        },
        {
          dir: 'dist',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].cjs',
          format: 'cjs',
        },
      ],
      external: [...regexpsOfPackages, /^node:.*$/],
    },
    target: 'esnext',
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
})
