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

const pageEntry = 'src/app/dashboard/reports/page.tsx'

const pageIconClasses = [
  'icon-[line-md--loading-loop]',
  'icon-[mdi-light--cog]',
  'icon-[mdi-light--folder]',
  'icon-[mdi-light--view-dashboard]',
]

export default function ReportsPage() {
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
          cssLoading: getIconcatCSSLoading('page manifest: global CSS in layout + page CSS from route and ancestors'),
          catalogMode: 'page icon CSS mode, nested segment layout',
          ...getIconcatIconSources(pageIconClasses),
          observability: [
            'dashboard/reports/layout.tsx emits a folder icon in an ancestor segment layout.',
            'IconcatAppRouterPageStylesheets receives only the leaf page entry and resolves ancestor layout/template CSS automatically.',
            'Global icons are subtracted from page CSS before hashing.',
          ],
          previewLabel: getIconcatPreviewLabel(),
        }}
        routeLink={renderRouteLink}
      />
    </>
  )
}
