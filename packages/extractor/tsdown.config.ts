import path from 'node:path'

import { defineIconcatPackageConfig, packageDir } from '../../build/tsdown-package.mjs'

const dirname = packageDir(import.meta.url)

export default defineIconcatPackageConfig({
  dirname,
  entries: [
    'src/index.ts',
    'src/rolldown.ts',
    'src/vite.ts',
  ],
  alias: {
    '@iconcat/adapter-utils': path.resolve(dirname, '../adapter-utils/src/index.ts'),
    '@iconcat/adapter-utils/next-app-router': path.resolve(dirname, '../adapter-utils/src/next-app-router.ts'),
    '@iconcat/core': path.resolve(dirname, '../core/src/index.ts'),
    '@iconcat/presets': path.resolve(dirname, '../presets/src/index.ts'),
  },
})
