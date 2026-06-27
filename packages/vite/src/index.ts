import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import { joinPublicPath, readIconcatManifestSync } from '@iconcat/adapter-utils'
import { iconcat as extractIconcat } from '@iconcat/extractor/vite'

import type { ReadIconcatManifestOptions } from '@iconcat/adapter-utils'
import type { IconcatConfig } from '@iconcat/extractor'
import type { Plugin } from 'vite'

export interface IconcatViteOptions extends IconcatConfig {
  manifest?: string
  sourceDir?: string
  assetDir?: string
  exposeHrefGlobal?: string
}

export function iconcat(options: IconcatViteOptions = {}): Plugin[] {
  return [
    extractIconcat(options),
    iconcatCSS(options),
  ]
}

export function createViteIconcatPublicPath(base = '/', assetDir = 'assets') {
  return joinPublicPath(base, assetDir)
}

export function iconcatCSS(options: IconcatViteOptions = {}): Plugin {
  const manifestOptions: ReadIconcatManifestOptions = {
    manifest: options.manifest,
  }
  const sourceDir = options.sourceDir || '.iconcat'
  const assetDir = options.assetDir || 'assets'
  const exposeHrefGlobal = options.exposeHrefGlobal || '__ICONCAT_CSS_HREF__'

  return {
    name: 'iconcat-css',
    apply: 'build',
    transformIndexHtml() {
      const manifest = readManifestIfExists(manifestOptions)
      if (!manifest) {
        return []
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
          children: `window.${exposeHrefGlobal}=${JSON.stringify(manifest.href)}`,
          injectTo: 'head',
        },
      ]
    },
    generateBundle() {
      const manifest = readManifestIfExists(manifestOptions)
      if (!manifest) {
        return
      }

      const sourceFile = resolve(process.cwd(), sourceDir, manifest.file)
      this.emitFile({
        type: 'asset',
        fileName: `${assetDir.replace(/\/$/, '')}/${manifest.file}`,
        source: readFileSync(sourceFile, 'utf8'),
      })
    },
  }
}

function readManifestIfExists(options: ReadIconcatManifestOptions) {
  const manifestFile = resolve(
    options.cwd || process.cwd(),
    options.manifest || '.iconcat/manifest.json',
  )

  if (!existsSync(manifestFile)) {
    return undefined
  }

  return readIconcatManifestSync(options)
}
