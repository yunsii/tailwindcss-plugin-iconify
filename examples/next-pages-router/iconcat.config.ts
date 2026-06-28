import process from 'node:process'

import { createNextIconcatPublicPath } from '@iconcat/next'
import { nextPages } from '@iconcat/presets'
import { createIconcatCSSArtifact } from '@iconcat/tailwind/catalog-css'
import { createEsbuildBundler, defineIconcatConfig } from 'iconcat'

const isPageMode = process.env.ICONCAT_MODE === 'page'
const iconcatDir = isPageMode ? '.iconcat/page-mode' : '.iconcat'
const iconcatCSSPublicPath = createNextIconcatPublicPath({
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
})
const nextPagesPreset = nextPages()
const nextPagesEntries = nextPagesPreset.entries

export default defineIconcatConfig({
  entries: isPageMode
    ? [
        'src/pages/_app.tsx',
        ...nextPagesEntries.filter((entry) => entry !== 'src/pages/_app.tsx'),
      ]
    : [
        { file: 'src/pages/_app.tsx', priority: true },
        ...nextPagesEntries.filter((entry) => entry !== 'src/pages/_app.tsx'),
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
  presets: isPageMode
    ? [
        {
          ...nextPagesPreset,
          entries: [],
          exclude: [
            ...(nextPagesPreset.exclude || []),
            'pages/_document.{js,jsx,ts,tsx}',
            'src/pages/_document.{js,jsx,ts,tsx}',
          ],
        },
      ]
    : [],
})
