import process from 'node:process'

import {
  getIconcatCSSHref,
  getIconcatCSSHrefsFromManifest,
  getIconcatPriorityCSSHrefsFromManifest,
  installIconcatCSS,
  joinPublicPath,
  readIconcatManifestSync,
} from '@iconcat/adapter-utils'

import type {
  InstallIconcatCSSOptions,
  ReadIconcatManifestOptions,
} from '@iconcat/adapter-utils'
import type { Head } from 'next/document'

export interface NextIconcatPublicPathOptions {
  assetPrefix?: string
  nextStaticCSSPath?: string
}

export type NextDocumentHead = typeof Head

export function createNextIconcatPublicPath(
  options: NextIconcatPublicPathOptions = {},
) {
  return joinPublicPath(
    options.assetPrefix || '',
    options.nextStaticCSSPath || '/_next/static/css',
  )
}

export function getNextIconcatCSSHref(
  options: ReadIconcatManifestOptions = {},
) {
  return getIconcatCSSHref(options)
}

export function createIconcatDocumentHead(
  BaseHead: NextDocumentHead,
  options: ReadIconcatManifestOptions = {},
): NextDocumentHead {
  type Files = Parameters<Head['getCssLinks']>[0]

  class IconcatDocumentHead extends BaseHead {
    getCssLinks(files: Files) {
      const cssLinks = super.getCssLinks(files)

      if (process.env.NODE_ENV !== 'production') {
        return cssLinks
      }

      try {
        const manifest = readIconcatManifestSync(options)
        const hrefs = getIconcatCSSHrefsFromManifest(manifest)
        const preloadHrefs = getIconcatPriorityCSSHrefsFromManifest(manifest)

        if (hrefs.length === 0) {
          return cssLinks
        }

        return [
          ...(cssLinks || []),
          ...preloadHrefs.map((href) => (
            <link
              as='style'
              href={href}
              key={`iconcat-preload:${href}`}
              rel='preload'
            />
          )),
          ...hrefs.map((href) => (
            <link
              href={href}
              key={`iconcat-stylesheet:${href}`}
              rel='stylesheet'
            />
          )),
        ]
      } catch {
        return cssLinks
      }
    }
  }

  return IconcatDocumentHead as unknown as NextDocumentHead
}

export function installNextIconcatCSS(
  options: Partial<InstallIconcatCSSOptions> = {},
) {
  return installIconcatCSS({
    ...options,
    targetDir: options.targetDir || '.next/static/css',
  })
}

export type {
  IconcatCSSManifest,
  IconcatCSSManifestEntry,
  IconcatCSSManifestFile,
  InstallIconcatCSSOptions,
  ReadIconcatManifestOptions,
} from '@iconcat/adapter-utils'

export {
  getIconcatNextAppRouterPageCSSFilesFromManifest,
  getIconcatNextAppRouterPageCSSHrefsFromManifest,
  getIconcatPageCSSFiles,
  getIconcatPageCSSHrefs,
  getNextAppRouterPageManifestEntries,
  getNextAppRouterRouteEntriesFromCandidates,
  isNextAppRouterPageEntry,
  readIconcatManifestSync,
  resolveNextAppRouterAncestorEntries,
  resolveNextAppRouterPageEntries,
} from '@iconcat/adapter-utils'
