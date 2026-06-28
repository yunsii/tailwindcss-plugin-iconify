import { DashboardShell } from './dashboard'

import type { DemoMeta, RouteLinkRenderer } from './dashboard'

export function HomePanel({
  meta,
  routeLink,
}: {
  meta: DemoMeta
  routeLink?: RouteLinkRenderer
}) {
  return (
    <DashboardShell active='home' meta={meta} routeLink={routeLink}>
      <span aria-label='home' className='demo-icon icon-[mdi-light--home]' />
    </DashboardShell>
  )
}
