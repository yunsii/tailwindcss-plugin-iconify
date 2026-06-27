/* eslint-disable react-refresh/only-export-components */
import { DashboardPanel } from '@iconcat/example-fixtures/dashboard-panel'

import { getIconcatStaticProps } from '../../page-props'

import type { IconcatPageProps } from '../../page-props'

export const getStaticProps = getIconcatStaticProps

export default function DashboardPage({ iconcatCSSHref }: IconcatPageProps) {
  return (
    <DashboardPanel
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
