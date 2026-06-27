import process from 'node:process'

import {
  getIconcatCSSHref,
  installIconcatCSS,
  joinPublicPath,
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

export interface NextIconcatStylesheetOptions extends ReadIconcatManifestOptions {
  precedence?: string
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

export function getAppRouterIconcatStylesheetProps(
  options: NextIconcatStylesheetOptions = {},
) {
  const href = getNextIconcatCSSHref(options)

  if (process.env.NODE_ENV !== 'production' || !href) {
    return undefined
  }

  return {
    href,
    precedence: options.precedence || 'next',
    rel: 'stylesheet',
  } as const
}

export function createIconcatDocumentHead(
  BaseHead: NextDocumentHead,
): NextDocumentHead {
  type Files = Parameters<Head['getCssLinks']>[0]

  class IconcatDocumentHead extends BaseHead {
    getCssLinks(files: Files) {
      const cssLinks = super.getCssLinks(files)
      const href = getNextIconcatCSSHref()

      if (process.env.NODE_ENV !== 'production' || !href) {
        return cssLinks
      }

      return [
        ...(cssLinks || []),
        <link
          as='style'
          href={href}
          key='iconcat-preload'
          rel='preload'
        />,
        <link
          href={href}
          key='iconcat-stylesheet'
          rel='stylesheet'
        />,
      ]
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
  InstallIconcatCSSOptions,
  ReadIconcatManifestOptions,
} from '@iconcat/adapter-utils'
