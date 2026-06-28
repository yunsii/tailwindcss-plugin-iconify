import process from 'node:process'

import { getIconcatPageCSSFiles, getNextIconcatCSSHref } from '@iconcat/next'

import type { IconcatCSSManifestFile, IconcatPageRoute } from '@iconcat/next'
import type { GetStaticProps } from 'next'

import { demoIconClasses, getIconcatCSSFiles } from './page-props'

import type { IconcatPageProps } from './page-props'

export const iconcatManifest = process.env.ICONCAT_MANIFEST || '.iconcat/manifest.json'

interface CreateIconcatPagePropsOptions {
  iconcatCSSHref: string | null
  iconcatPageCSSFiles: IconcatCSSManifestFile[]
  iconcatPageCSSHref: string | null
  isDevelopment: boolean
}

export function createIconcatStaticProps(page?: IconcatPageRoute): GetStaticProps<IconcatPageProps> {
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const iconcatCSSHref = isDevelopment
    ? null
    : getNextIconcatCSSHref({ manifest: iconcatManifest }) || null
  const iconcatPageCSSFiles = page && !isDevelopment
    ? getIconcatPageCSSFiles(page, { manifest: iconcatManifest })
    : []
  const iconcatPageCSSHref = iconcatPageCSSFiles[0]?.href || null

  return () => ({
    props: createIconcatPageProps({
      iconcatCSSHref,
      iconcatPageCSSFiles,
      iconcatPageCSSHref,
      isDevelopment,
    }),
  })
}

export function createIconcatPageProps(
  {
    iconcatCSSHref,
    iconcatPageCSSFiles,
    iconcatPageCSSHref,
    isDevelopment,
  }: CreateIconcatPagePropsOptions,
): IconcatPageProps {
  return {
    devIconClasses: isDevelopment ? demoIconClasses : [],
    iconcatCSSFiles: getIconcatCSSFiles(iconcatCSSHref, iconcatPageCSSHref, isDevelopment),
    iconcatCSSHref,
    iconcatPageCSSFiles,
    iconcatPageCSSHref,
    previewLabel: isDevelopment ? 'development preview' : 'production preview',
  }
}
