import { DashboardPanel } from '@iconcat/example-fixtures/dashboard-panel'
import { defineIconcatIcons } from 'iconcat/runtime'

import { getIconcatCSSHref } from '../../iconcat-manifest'

const dashboardConfigurableIcons = defineIconcatIcons([
  'mdi-light:chart-line',
  'mdi-light:calendar',
])

export default function DashboardPage() {
  return (
    <DashboardPanel
      meta={{
        appType: 'Next.js App Router',
        routerType: 'App Router',
        cssHref: getIconcatCSSHref(),
        cssTarget: '.next/static/css/iconcat.[hash].css',
        cssLoading: 'global priority + normal CSS in root layout',
        catalogMode: `${dashboardConfigurableIcons.length} configurable icons`,
      }}
    />
  )
}
