import { defineIconcatPackageConfig, packageDir } from '../../build/tsdown-package.mjs'

export default defineIconcatPackageConfig({
  dirname: packageDir(import.meta.url),
  entries: [
    'src/plugin.ts',
    'src/local-icon-sets.ts',
    'src/figma-icon-sets.ts',
    'src/figma-icon-sets-node.ts',
  ],
})
