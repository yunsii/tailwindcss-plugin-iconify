import { nextPages } from '@iconcat/presets'
import { createIconcatCSSArtifact } from '@iconcat/tailwind/catalog-css'
import { createEsbuildBundler, defineIconcatConfig } from 'iconcat'

import { iconcatCSSPublicPath } from './iconcat-public-path.mjs'

export default defineIconcatConfig({
  entries: [
    { file: 'src/pages/_app.tsx', priority: true },
    ...nextPages().entries.filter((entry) => entry !== 'src/pages/_app.tsx'),
  ],
  output: '.iconcat/catalog.json',
  bundler: createEsbuildBundler({
    includeDeps: ['@iconcat/example-fixtures'],
  }),
  artifacts: [
    createIconcatCSSArtifact({
      artifactMode: 'global',
      output: '.iconcat/iconcat.[hash].css',
      manifest: '.iconcat/manifest.json',
      publicPath: iconcatCSSPublicPath,
    }),
  ],
})
