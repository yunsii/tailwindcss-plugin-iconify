/* eslint-disable react-refresh/only-export-components */
import { HomePanel } from '@iconcat/example-fixtures/home'

import { createIconcatStaticProps } from '../page-props'

import type { IconcatPageProps } from '../page-props'

export const getStaticProps = createIconcatStaticProps()

export default function Page({ iconcatCSSHref }: IconcatPageProps) {
  return (
    <HomePanel
      meta={{
        appType: 'Next.js Pages Router',
        routerType: 'Pages Router',
        cssHref: iconcatCSSHref || undefined,
        cssTarget: '.next/static/css/iconcat.[hash].css',
        cssLoading: 'global priority + normal CSS in _document',
      }}
    />
  )
}
