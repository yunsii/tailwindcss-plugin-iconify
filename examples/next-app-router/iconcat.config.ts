import process from 'node:process'

import { createNextIconcatPublicPath } from '@iconcat/next'
import { nextApp } from '@iconcat/presets'
import { createIconcatCSSArtifact } from '@iconcat/tailwind/catalog-css'
import { createEsbuildBundler, defineIconcatConfig } from 'iconcat'

const isPageMode = process.env.ICONCAT_MODE === 'page'
const iconcatDir = isPageMode ? '.iconcat/page-mode' : '.iconcat'
const iconcatCSSPublicPath = createNextIconcatPublicPath({
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
})
const nextAppEntries = nextApp().entries
const nextAppPageEntries = nextAppEntries.filter((entry) => entry.includes('/page.'))

export default defineIconcatConfig({
  entries: isPageMode
    ? nextAppPageEntries
    : [
        { file: 'src/app/layout.tsx', priority: true },
        ...nextAppEntries.filter((entry) => entry !== 'src/app/layout.tsx'),
      ],
  output: `${iconcatDir}/catalog.json`,
  bundler: createEsbuildBundler({
    includeDeps: ['@iconcat/example-fixtures'],
  }),
  artifacts: [
    createIconcatCSSArtifact({
      artifactMode: isPageMode ? 'page' : 'global',
      output: `${iconcatDir}/iconcat.[hash].css`,
      manifest: `${iconcatDir}/manifest.json`,
      publicPath: iconcatCSSPublicPath,
    }),
  ],
})
