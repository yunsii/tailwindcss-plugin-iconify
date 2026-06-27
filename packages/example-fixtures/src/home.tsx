import { DashboardShell } from './dashboard'

import type { DemoMeta } from './dashboard'

export function HomePanel({ meta }: { meta: DemoMeta }) {
  return (
    <DashboardShell active='home' meta={meta}>
      <span aria-label='home' className='demo-icon icon-[mdi-light--home]' />
    </DashboardShell>
  )
}
