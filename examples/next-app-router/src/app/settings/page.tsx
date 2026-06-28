import { SettingsPanel } from '@iconcat/example-fixtures/settings'
import { IconcatAppRouterPageStylesheets } from '@iconcat/next/app-router'

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

const pageRoute = '/settings'
const pageIconClasses = [
  'icon-[line-md--loading-loop]',
  'icon-[mdi-light--cog]',
  'icon-[mdi-light--view-dashboard]',
]

export default function SettingsPage() {
  return (
    <>
      <IconcatAppRouterPageStylesheets manifest={iconcatManifest} page={pageRoute} />
      <SettingsPanel
        meta={{
          appType: 'Next.js App Router',
          routerType: 'App Router',
          cssHref: [getIconcatCSSHref(), getIconcatPageCSSHref(pageRoute)].filter(Boolean).join(' + '),
          cssFiles: getIconcatCSSFiles(pageRoute),
          cssTarget: '.next/static/css/iconcat.[hash].css',
          cssLoading: getIconcatCSSLoading('page manifest: global CSS in layout + page CSS in route'),
          catalogMode: 'page icon CSS mode',
          ...getIconcatIconSources(pageIconClasses),
          observability: [
            'The route path "/settings" is resolved through manifest.pageRoutes to the generated App Router page entry.',
            'layout.tsx is used by every resolved App Router page, so Home is loaded as shell CSS.',
            'settings/page.tsx emits Settings and shared loading icons into page CSS.',
          ],
          previewLabel: getIconcatPreviewLabel(),
        }}
        routeLink={renderRouteLink}
      />
    </>
  )
}
