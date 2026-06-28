import process from 'node:process'

import { getIconcatPageCSSFiles, getNextIconcatCSSHref } from '@iconcat/next'

import type { IconcatPageRoute } from '@iconcat/next'
import type { GetServerSideProps } from 'next'

import { createIconcatPageProps, iconcatManifest } from './page-static-props'

import type { IconcatPageProps } from './page-props'

export function createIconcatServerSideProps(page?: IconcatPageRoute): GetServerSideProps<IconcatPageProps> {
  return async () => {
    const isDevelopment = process.env.NODE_ENV !== 'production'
    const iconcatCSSHref = isDevelopment
      ? null
      : getNextIconcatCSSHref({ manifest: iconcatManifest }) || null
    const iconcatPageCSSFiles = page && !isDevelopment
      ? getIconcatPageCSSFiles(page, { manifest: iconcatManifest })
      : []
    const iconcatPageCSSHref = iconcatPageCSSFiles[0]?.href || null

    return {
      props: createIconcatPageProps({
        iconcatCSSHref,
        iconcatPageCSSFiles,
        iconcatPageCSSHref,
        isDevelopment,
      }),
    }
  }
}
