import { DashboardPanel } from '@iconcat/example-fixtures/dashboard-panel'
import { IconcatAppRouterPageStylesheets } from '@iconcat/next/app-router'

import {
  getIconcatCSSFiles,
  getIconcatCSSHref,
  getIconcatCSSLoading,
  getIconcatIconSources,
  getIconcatPageCSSHref,
  getIconcatPreviewLabel,
  iconcatManifest,
} from '../../../iconcat-manifest'
import { renderRouteLink } from '../../../route-link'

const pageRoute = '/dashboard/reports'

const pageIconClasses = [
  'icon-[line-md--loading-loop]',
  'icon-[mdi-light--cog]',
  'icon-[mdi-light--folder]',
  'icon-[mdi-light--view-dashboard]',
]

export default function ReportsPage() {
  return (
    <>
      <IconcatAppRouterPageStylesheets manifest={iconcatManifest} page={pageRoute} />
      <DashboardPanel
        meta={{
          appType: 'Next.js App Router',
          routerType: 'App Router',
          cssHref: [getIconcatCSSHref(), getIconcatPageCSSHref(pageRoute)].filter(Boolean).join(' + '),
          cssFiles: getIconcatCSSFiles(pageRoute),
          cssTarget: '.next/static/css/iconcat.[hash].css',
          cssLoading: getIconcatCSSLoading('page manifest: global CSS in layout + page CSS from route and ancestors'),
          catalogMode: 'page icon CSS mode, nested segment layout',
          ...getIconcatIconSources(pageIconClasses),
          observability: [
            'The route path "/dashboard/reports" is resolved through manifest.pageRoutes to the generated App Router page entry.',
            'dashboard/reports/layout.tsx emits a folder icon in an ancestor segment layout.',
            'IconcatAppRouterPageStylesheets resolves the leaf page entry and ancestor layout/template CSS automatically.',
            'Global icons are subtracted from page CSS before hashing.',
          ],
          previewLabel: getIconcatPreviewLabel(),
        }}
        routeLink={renderRouteLink}
      />
    </>
  )
}
