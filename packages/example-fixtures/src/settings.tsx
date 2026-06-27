import { DashboardShell } from './dashboard'

import type { DemoMeta } from './dashboard'

export function SettingsPanel({ meta }: { meta: DemoMeta }) {
  return (
    <DashboardShell active='settings' meta={meta}>
      <span aria-label='settings' className='demo-icon icon-[mdi-light--cog]' />
    </DashboardShell>
  )
}
