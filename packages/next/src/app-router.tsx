/* eslint-disable node/prefer-global/process */
import {
  getIconcatCSSHrefs,
  getIconcatNextAppRouterPageCSSFilesFromManifest,
  readIconcatManifestSync,
} from '@iconcat/adapter-utils'
import { createElement } from 'react'

import type { IconcatCSSManifestFile, IconcatPageRoute, ReadIconcatManifestOptions } from '@iconcat/adapter-utils'

export interface IconcatAppRouterStylesheetsProps extends ReadIconcatManifestOptions {
  precedence?: string
}

export function IconcatAppRouterStylesheets(
  { precedence = 'next', ...options }: IconcatAppRouterStylesheetsProps = {},
) {
  const hrefs = process.env.NODE_ENV === 'production'
    ? getIconcatCSSHrefs(options)
    : []

  if (process.env.NODE_ENV !== 'production' || !hrefs?.length) {
    return null
  }

  return (
    <>
      {hrefs.map((href) => (
        createElement('link', {
          href,
          key: href,
          precedence,
          rel: 'stylesheet',
        })
      ))}
    </>
  )
}

export interface IconcatAppRouterPageStylesheetsProps extends IconcatAppRouterStylesheetsProps {
  page: IconcatPageRoute
}

export function IconcatAppRouterPageStylesheets(
  { page, precedence = 'next', ...options }: IconcatAppRouterPageStylesheetsProps,
) {
  const files = process.env.NODE_ENV === 'production'
    ? readIconcatPageCSSFiles(page, options)
    : []

  if (process.env.NODE_ENV !== 'production' || !files?.length) {
    return null
  }

  return (
    <>
      {files.map((file) => (
        createElement('link', {
          href: file.href,
          key: file.href,
          precedence,
          rel: 'stylesheet',
        })
      ))}
    </>
  )
}

function readIconcatPageCSSFiles(
  page: IconcatPageRoute,
  options: ReadIconcatManifestOptions,
): IconcatCSSManifestFile[] {
  const manifest = readIconcatManifestSync(options)
  return getIconcatNextAppRouterPageCSSFilesFromManifest(manifest, page)
}
