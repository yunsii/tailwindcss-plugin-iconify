import { DashboardShell } from './dashboard'

import type { DemoMeta, RouteLinkRenderer } from './dashboard'

export function DashboardPanel({
  meta,
  routeLink,
}: {
  meta: DemoMeta
  routeLink?: RouteLinkRenderer
}) {
  return (
    <DashboardShell active='dashboard' meta={meta} routeLink={routeLink}>
      <span
        aria-label='dashboard'
        className='demo-icon icon-[mdi-light--view-dashboard]'
      />
    </DashboardShell>
  )
}
