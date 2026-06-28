import process from 'node:process'

import { reactRouter } from '@iconcat/presets'
import { createIconcatCSSArtifact } from '@iconcat/tailwind/catalog-css'
import { createViteIconcatPublicPath, iconcat } from '@iconcat/vite'
import react from '@vitejs/plugin-react'
import { createEsbuildBundler } from 'iconcat'
import { defineConfig } from 'vite'

const base = process.env.VITE_BASE || '/'
const iconcatPublicPath = createViteIconcatPublicPath(base)

export default defineConfig({
  base,
  plugins: [
    react(),
    iconcat({
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
          publicPath: iconcatPublicPath,
        }),
      ],
    }),
  ],
})
