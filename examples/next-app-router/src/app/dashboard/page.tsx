import { DashboardPanel } from '@iconcat/example-fixtures/dashboard-panel'

import { getIconcatCSSHref } from '../../iconcat-manifest'

export default function DashboardPage() {
  return (
    <DashboardPanel
      meta={{
        appType: 'Next.js App Router',
        routerType: 'App Router',
        cssHref: getIconcatCSSHref(),
        cssTarget: '.next/static/css/iconcat.[hash].css',
        cssLoading: 'stylesheet link with App Router precedence',
      }}
    />
  )
}
