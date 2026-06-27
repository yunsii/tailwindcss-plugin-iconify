/* eslint-disable react-refresh/only-export-components */
import { SettingsPanel } from '@iconcat/example-fixtures/settings'

import { getIconcatStaticProps } from '../../page-props'

import type { IconcatPageProps } from '../../page-props'

export const getStaticProps = getIconcatStaticProps

export default function SettingsPage({ iconcatCSSHref }: IconcatPageProps) {
  return (
    <SettingsPanel
      meta={{
        appType: 'Next.js Pages Router',
        routerType: 'Pages Router',
        cssHref: iconcatCSSHref || undefined,
        cssTarget: '.next/static/css/iconcat.[hash].css',
        cssLoading: 'manual preload hint plus stylesheet link',
      }}
    />
  )
}
