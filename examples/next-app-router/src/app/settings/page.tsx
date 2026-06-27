import { SettingsPanel } from '@iconcat/example-fixtures/settings'

import { getIconcatCSSHref } from '../../iconcat-manifest'

export default function SettingsPage() {
  return (
    <SettingsPanel
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
