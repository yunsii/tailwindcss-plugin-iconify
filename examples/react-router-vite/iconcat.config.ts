import { reactRouter } from '@iconcat/presets'
import { createIconcatCSSArtifact } from '@iconcat/tailwind/catalog-css'
import { createEsbuildBundler, defineIconcatConfig } from 'iconcat'

export default defineIconcatConfig({
  presets: [reactRouter()],
  output: '.iconcat/catalog.json',
  bundler: createEsbuildBundler({
    includeDeps: ['@iconcat/example-fixtures'],
  }),
  artifacts: [
    createIconcatCSSArtifact({
      artifactMode: 'global',
      output: '.iconcat/iconcat.[hash].css',
      manifest: '.iconcat/manifest.json',
    }),
  ],
})
