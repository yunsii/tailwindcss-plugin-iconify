/* eslint-disable react-refresh/only-export-components */
import { DashboardPanel } from '@iconcat/example-fixtures/dashboard-panel'
import { defineIconcatIcons } from 'iconcat/runtime'

import { createIconcatStaticProps } from '../../page-props'

import type { IconcatPageProps } from '../../page-props'

export const getStaticProps = createIconcatStaticProps()

const dashboardConfigurableIcons = defineIconcatIcons([
  'mdi-light:chart-line',
  'mdi-light:calendar',
])

export default function DashboardPage({ iconcatCSSHref }: IconcatPageProps) {
  return (
    <DashboardPanel
      meta={{
        appType: 'Next.js Pages Router',
        routerType: 'Pages Router',
        cssHref: iconcatCSSHref || undefined,
        cssTarget: '.next/static/css/iconcat.[hash].css',
        cssLoading: 'global priority + normal CSS in _document',
        catalogMode: `${dashboardConfigurableIcons.length} configurable icons`,
      }}
    />
  )
}
