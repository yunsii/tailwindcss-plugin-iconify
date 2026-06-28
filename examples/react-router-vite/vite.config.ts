import process from 'node:process'

import { reactRouter } from '@iconcat/presets'
import { createIconcatCSSArtifact } from '@iconcat/tailwind/catalog-css'
import { createViteIconcatPublicPath, iconcat } from '@iconcat/vite'
import react from '@vitejs/plugin-react'
import { createEsbuildBundler } from 'iconcat'
import { defineConfig } from 'vite'

const base = process.env.VITE_BASE || '/'
const isPageMode = process.env.ICONCAT_MODE === 'page'
const iconcatDir = isPageMode ? '.iconcat/page-mode' : '.iconcat'
const iconcatPublicPath = createViteIconcatPublicPath(base)
const reactRouterEntries = reactRouter().entries

export default defineConfig({
  base,
  plugins: [
    react(),
    iconcat({
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
          publicPath: iconcatPublicPath,
        }),
      ],
      ...(isPageMode
        ? {
            manifest: `${iconcatDir}/manifest.json`,
            sourceDir: iconcatDir,
          }
        : {}),
    }),
  ],
})
