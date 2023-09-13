import path from 'path'

import { defineConfig, loadEnv, mergeConfig } from 'vite'
import dts from 'vite-plugin-dts'

import { dependencies } from './package.json'
import baseConfig from './vite.base.config'

import type { UserConfig } from 'vite'

const externalPackages = [...Object.keys(dependencies || {})]

// Creating regexps of the packages to make sure subpaths of the
// packages are also treated as external
const regexpsOfPackages = externalPackages.map(
  (packageName) => new RegExp(`^${packageName}(/.*)?`),
)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname)

  return mergeConfig(baseConfig, {
    define: {
      'process.env.VITE_FIGMA_TOKEN': `"${env.VITE_FIGMA_TOKEN}"`,
    },
    plugins: [dts()],
    build: {
      minify: false,
      lib: {
        entry: [
          path.resolve(__dirname, 'src/plugin.ts'),
          path.resolve(__dirname, 'src/extensions/local-icon-sets.ts'),
          path.resolve(__dirname, 'src/extensions/figma-icon-sets/index.ts'),
          path.resolve(__dirname, 'src/extensions/figma-icon-sets/node.ts'),
        ],
      },
      rollupOptions: {
        // inspired from: https://github.com/vitejs/vite/discussions/1736#discussioncomment-2621441
        // preserveModulesRoot: https://rollupjs.org/guide/en/#outputpreservemodulesroot
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
  } as UserConfig)
})
