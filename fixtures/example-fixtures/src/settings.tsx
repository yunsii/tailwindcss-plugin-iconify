import { DashboardShell } from './dashboard'

import type { DemoMeta, RouteLinkRenderer } from './dashboard'

export function SettingsPanel({
  meta,
  routeLink,
}: {
  meta: DemoMeta
  routeLink?: RouteLinkRenderer
}) {
  return (
    <DashboardShell active='settings' meta={meta} routeLink={routeLink}>
      <span aria-label='settings' className='demo-icon icon-[mdi-light--cog]' />
    </DashboardShell>
  )
}
