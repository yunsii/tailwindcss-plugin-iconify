/* eslint-disable react-refresh/only-export-components */
import { SettingsPanel } from '@iconcat/example-fixtures/settings'

import { createIconcatStaticProps } from '../../page-props'

import type { IconcatPageProps } from '../../page-props'

export const getStaticProps = createIconcatStaticProps()

export default function SettingsPage({ iconcatCSSHref }: IconcatPageProps) {
  return (
    <SettingsPanel
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
