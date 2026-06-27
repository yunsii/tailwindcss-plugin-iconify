import { DashboardShell } from './dashboard'

import type { DemoMeta } from './dashboard'

export function DashboardPanel({ meta }: { meta: DemoMeta }) {
  return (
    <DashboardShell active='dashboard' meta={meta}>
      <span
        aria-label='dashboard'
        className='demo-icon icon-[mdi-light--view-dashboard]'
      />
    </DashboardShell>
  )
}
