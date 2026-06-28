import process from 'node:process'

import { reactRouter } from '@iconcat/presets'
import { createIconcatCSSArtifact } from '@iconcat/tailwind/catalog-css'
import { createEsbuildBundler, defineIconcatConfig } from 'iconcat'

const isPageMode = process.env.ICONCAT_MODE === 'page'
const iconcatDir = isPageMode ? '.iconcat/page-mode' : '.iconcat'
const reactRouterEntries = reactRouter().entries

export default defineIconcatConfig({
  ...(isPageMode
    ? {
        entries: [
          { file: 'src/App.tsx', scope: 'global' as const },
          ...reactRouterEntries.filter((entry) => entry !== 'src/App.{js,jsx,ts,tsx}'),
        ],
      }
    : {
        presets: [reactRouter()],
      }),
  output: `${iconcatDir}/catalog.json`,
  bundler: createEsbuildBundler({
    includeDeps: ['@iconcat/example-fixtures'],
  }),
  artifacts: [
    createIconcatCSSArtifact({
      artifactMode: isPageMode ? 'page' : 'global',
      output: `${iconcatDir}/iconcat.[hash].css`,
      manifest: `${iconcatDir}/manifest.json`,
    }),
  ],
})
