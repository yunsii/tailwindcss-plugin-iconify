import { DashboardPanel } from '@iconcat/example-fixtures/dashboard-panel'
import { IconcatAppRouterPageStylesheets } from '@iconcat/next/app-router'
import { defineIconcatIcons } from 'iconcat/runtime'

import {
  getIconcatCSSFiles,
  getIconcatCSSHref,
  getIconcatCSSLoading,
  getIconcatIconSources,
  getIconcatPageCSSHref,
  getIconcatPreviewLabel,
  iconcatManifest,
} from '../../iconcat-manifest'
import { renderRouteLink } from '../../route-link'

const pageEntry = 'src/app/dashboard/page.tsx'

const dashboardConfigurableIcons = defineIconcatIcons([
  'mdi-light:chart-line',
  'mdi-light:calendar',
])

const pageIconClasses = [
  'icon-[line-md--loading-loop]',
  'icon-[mdi-light--calendar]',
  'icon-[mdi-light--chart-line]',
  'icon-[mdi-light--cog]',
  'icon-[mdi-light--view-dashboard]',
]

export default function DashboardPage() {
  return (
    <>
      <IconcatAppRouterPageStylesheets manifest={iconcatManifest} page={pageEntry} />
      <DashboardPanel
        meta={{
          appType: 'Next.js App Router',
          routerType: 'App Router',
          cssHref: [getIconcatCSSHref(), getIconcatPageCSSHref(pageEntry)].filter(Boolean).join(' + '),
          cssFiles: getIconcatCSSFiles(pageEntry),
          cssTarget: '.next/static/css/iconcat.[hash].css',
          cssLoading: getIconcatCSSLoading('page manifest: global CSS in layout + page CSS in route'),
          catalogMode: `page icon CSS mode, ${dashboardConfigurableIcons.length} configurable icons`,
          configurableIconItems: [
            {
              className: 'icon-[mdi-light--chart-line]',
              icon: 'mdi-light:chart-line',
              label: 'Configurable chart',
            },
            {
              className: 'icon-[mdi-light--calendar]',
              icon: 'mdi-light:calendar',
              label: 'Configurable calendar',
            },
          ],
          ...getIconcatIconSources(pageIconClasses),
          observability: [
            'layout.tsx is used by every resolved App Router page, so Home is loaded before route content.',
            'dashboard/page.tsx emits the dashboard route icon and configurable allowlist icons into page CSS.',
            'Global icons are subtracted from page CSS before hashing.',
          ],
          previewLabel: getIconcatPreviewLabel(),
        }}
        routeLink={renderRouteLink}
      />
    </>
  )
}
