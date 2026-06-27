import { HomePanel } from '@iconcat/example-fixtures/home'

import { getIconcatCSSHref } from '../iconcat-manifest'

export default function Page() {
  return (
    <HomePanel
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
