/* eslint-disable node/prefer-global/process */
import { getIconcatCSSHrefs } from '@iconcat/adapter-utils'
import { createElement } from 'react'

import type { ReadIconcatManifestOptions } from '@iconcat/adapter-utils'

export interface IconcatAppRouterStylesheetsProps extends ReadIconcatManifestOptions {
  precedence?: string
}

interface ReactStylesheetProps {
  href: string
  precedence: string
  rel: 'stylesheet'
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
        } satisfies ReactStylesheetProps & { key: string })
      ))}
    </>
  )
}
