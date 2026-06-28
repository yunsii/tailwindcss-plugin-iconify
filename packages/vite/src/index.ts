import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import {
  getIconcatCSSHrefsFromManifest,
  getIconcatManifestFiles,
  joinPublicPath,
  readIconcatManifestSync,
} from '@iconcat/adapter-utils'
import { writeIconCatalog } from '@iconcat/extractor'

import type { ReadIconcatManifestOptions } from '@iconcat/adapter-utils'
import type { IconcatConfig } from '@iconcat/extractor'
import type { IndexHtmlTransformResult, Plugin } from 'vite'

export interface IconcatViteOptions extends IconcatConfig {
  manifest?: string
  sourceDir?: string
  assetDir?: string
  exposeHrefGlobal?: string
}

export function iconcat(options: IconcatViteOptions = {}): Plugin[] {
  return [
    createIconcatCSSPlugin(options, true),
  ]
}

export function createViteIconcatPublicPath(base = '/', assetDir = 'assets') {
  return joinPublicPath(base, assetDir)
}

export function iconcatCSS(options: IconcatViteOptions = {}): Plugin {
  return createIconcatCSSPlugin(options, false)
}

function createIconcatCSSPlugin(
  options: IconcatViteOptions,
  extract: boolean,
): Plugin {
  const manifestOptions: ReadIconcatManifestOptions = {
    cwd: options.cwd,
    manifest: options.manifest,
  }
  const sourceDir = options.sourceDir || '.iconcat'
  const assetDir = options.assetDir || 'assets'
  const exposeHrefGlobal = options.exposeHrefGlobal || '__ICONCAT_CSS_HREF__'
  const cwd = options.cwd || process.cwd()
  let extraction: Promise<void> | undefined

  return {
    name: extract ? 'iconcat' : 'iconcat-css',
    apply: 'build',
    buildStart() {
      if (!extract) {
        return
      }
      extraction = writeIconCatalog(options).then(() => undefined)
      void extraction.catch(() => {})
    },
    async transformIndexHtml() {
      const manifest = await readManifestAfterExtraction(extraction, manifestOptions)
      if (!manifest) {
        return []
      }
      const hrefs = getIconcatCSSHrefsFromManifest(manifest)
      const [href] = hrefs
      const tags: IndexHtmlTransformResult = hrefs.map((href) => ({
        tag: 'link',
        attrs: {
          rel: 'stylesheet',
          href,
        },
        injectTo: 'head',
      } as const))

      if (href) {
        tags.push({
          tag: 'script',
          children: `window.${exposeHrefGlobal}=${JSON.stringify(href)}`,
          injectTo: 'head',
        } as const)
      }

      return tags
    },
    async generateBundle() {
      const manifest = await readManifestAfterExtraction(extraction, manifestOptions)
      if (!manifest) {
        return
      }

      for (const file of getIconcatManifestFiles(manifest)) {
        const sourceFile = resolve(cwd, sourceDir, file)

        this.emitFile({
          type: 'asset',
          fileName: `${assetDir.replace(/\/$/, '')}/${file}`,
          source: readFileSync(sourceFile, 'utf8'),
        })
      }
    },
  }
}

async function readManifestAfterExtraction(
  extraction: Promise<void> | undefined,
  options: ReadIconcatManifestOptions,
) {
  await extraction
  return readManifestIfExists(options)
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
