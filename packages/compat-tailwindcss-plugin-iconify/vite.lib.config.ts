import path from 'node:path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    minify: false,
    lib: {
      entry: [
        path.resolve(__dirname, 'src/plugin.ts'),
        path.resolve(__dirname, 'src/local-icon-sets.ts'),
        path.resolve(__dirname, 'src/figma-icon-sets.ts'),
        path.resolve(__dirname, 'src/figma-icon-sets-node.ts'),
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
      external: [/^@iconcat\/tailwind(\/.*)?$/, /^tailwindcss(\/.*)?$/, /^node:.*$/],
    },
    target: 'esnext',
  },
})
