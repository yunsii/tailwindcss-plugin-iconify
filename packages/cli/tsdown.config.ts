import { defineIconcatPackageConfig, packageDir } from '../../build/tsdown-package.mjs'

export default defineIconcatPackageConfig({
  dirname: packageDir(import.meta.url),
  entries: [
    'src/index.ts',
    'src/cli.ts',
    'src/runtime.ts',
  ],
  formats: ['esm'],
})
