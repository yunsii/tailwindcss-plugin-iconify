import path from 'node:path'
import process from 'node:process'

import { defineIconcatPackageConfig, packageDir } from '../../build/tsdown-package.mjs'

const dirname = packageDir(import.meta.url)

export default defineIconcatPackageConfig({
  dirname,
  entries: [
    'src/plugin.ts',
    'src/catalog-css.ts',
    'src/extensions/local-icon-sets.ts',
    'src/extensions/figma-icon-sets/index.ts',
    'src/extensions/figma-icon-sets/node.ts',
  ],
  alias: {
    '@': path.resolve(dirname, 'src'),
    '@iconcat/core': path.resolve(dirname, '../core/src/index.ts'),
  },
  define: {
    'process.env.VITE_FIGMA_TOKEN': JSON.stringify(process.env.VITE_FIGMA_TOKEN || ''),
  },
})
