import path from 'node:path'

import { defineIconcatPackageConfig, packageDir } from '../../build/tsdown-package.mjs'

const dirname = packageDir(import.meta.url)

export default defineIconcatPackageConfig({
  dirname,
  entries: [
    'src/index.ts',
    'src/vite.ts',
  ],
  alias: {
    '@iconcat/core': path.resolve(dirname, '../core/src/index.ts'),
    '@iconcat/presets': path.resolve(dirname, '../presets/src/index.ts'),
  },
})
