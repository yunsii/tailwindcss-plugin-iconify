import { nextApp } from '@iconcat/presets'
import { createIconcatCSSArtifact } from '@iconcat/tailwind/catalog-css'
import { createEsbuildBundler, defineIconcatConfig } from 'iconcat'

import { iconcatCSSPublicPath } from './iconcat-public-path.mjs'

export default defineIconcatConfig({
  entries: [
    { file: 'src/app/layout.tsx', priority: true },
    ...nextApp().entries.filter((entry) => entry !== 'src/app/layout.tsx'),
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
