import path from 'node:path'

import { defineIconcatPackageConfig, packageDir } from '../../build/tsdown-package.mjs'

const dirname = packageDir(import.meta.url)

export default defineIconcatPackageConfig({
  dirname,
  entries: ['src/index.tsx'],
  alias: {
    '@iconcat/adapter-utils': path.resolve(dirname, '../adapter-utils/src/index.ts'),
  },
})
