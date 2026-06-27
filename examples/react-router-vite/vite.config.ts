import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import { iconcat } from '@iconcat/extractor/vite'
import { reactRouter } from '@iconcat/presets'
import { createIconcatCSSArtifact } from '@iconcat/tailwind/catalog-css'
import react from '@vitejs/plugin-react'
import { createEsbuildBundler } from 'iconcat'
import { defineConfig } from 'vite'

const base = process.env.VITE_BASE || '/'
const iconcatPublicPath = joinPublicPath(base, '/assets')

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
          output: '.iconcat/iconcat.[hash].css',
          manifest: '.iconcat/manifest.json',
          publicPath: iconcatPublicPath,
        }),
      ],
    }),
    {
      name: 'iconcat-css-link',
      apply: 'build',
      transformIndexHtml() {
        const manifestFile = resolve(process.cwd(), '.iconcat/manifest.json')
        if (!existsSync(manifestFile)) {
          return []
        }
        const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as {
          href: string
        }

        return [
          {
            tag: 'link',
            attrs: {
              rel: 'stylesheet',
              href: manifest.href,
            },
            injectTo: 'head',
          },
          {
            tag: 'script',
            children: `window.__ICONCAT_CSS_HREF__=${JSON.stringify(manifest.href)}`,
            injectTo: 'head',
          },
        ]
      },
      generateBundle() {
        const manifestFile = resolve(process.cwd(), '.iconcat/manifest.json')
        if (!existsSync(manifestFile)) {
          return
        }
        const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as {
          file: string
        }
        const sourceFile = resolve(process.cwd(), '.iconcat', manifest.file)
        this.emitFile({
          type: 'asset',
          fileName: `assets/${manifest.file}`,
          source: readFileSync(sourceFile, 'utf8'),
        })
      },
    },
  ],
})

function joinPublicPath(prefix: string, path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!prefix || prefix === '/') {
    return normalizedPath
  }

  return `${prefix.replace(/\/$/, '')}${normalizedPath}`
}
