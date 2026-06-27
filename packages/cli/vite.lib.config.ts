import path from 'node:path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    minify: false,
    lib: {
      entry: [
        path.resolve(__dirname, 'src/index.ts'),
        path.resolve(__dirname, 'src/cli.ts'),
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
      ],
      external: [/^@iconcat\/extractor(\/.*)?$/, /^jiti(\/.*)?$/, /^pathe(\/.*)?$/, /^node:.*$/],
    },
    target: 'esnext',
  },
})
