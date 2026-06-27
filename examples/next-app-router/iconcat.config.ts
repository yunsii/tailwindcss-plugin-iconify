import { nextApp } from '@iconcat/presets'
import { createIconcatCSSArtifact } from '@iconcat/tailwind/catalog-css'
import { createEsbuildBundler, defineIconcatConfig } from 'iconcat'

import { iconcatCSSPublicPath } from './iconcat-public-path.mjs'

export default defineIconcatConfig({
  presets: [nextApp()],
  output: '.iconcat/catalog.json',
  bundler: createEsbuildBundler({
    includeDeps: ['@iconcat/example-fixtures'],
  }),
  artifacts: [
    createIconcatCSSArtifact({
      output: '.iconcat/iconcat.[hash].css',
      manifest: '.iconcat/manifest.json',
      publicPath: iconcatCSSPublicPath,
    }),
  ],
})
