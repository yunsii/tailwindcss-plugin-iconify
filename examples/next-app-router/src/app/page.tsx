import { HomePanel } from '@iconcat/example-fixtures/home'
import { IconcatAppRouterPageStylesheets } from '@iconcat/next/app-router'

import {
  getIconcatCSSFiles,
  getIconcatCSSHref,
  getIconcatCSSLoading,
  getIconcatIconSources,
  getIconcatPageCSSHref,
  getIconcatPreviewLabel,
  iconcatManifest,
} from '../iconcat-manifest'
import { renderRouteLink } from '../route-link'

const pageRoute = '/'
const pageIconClasses = [
  'icon-[line-md--loading-loop]',
  'icon-[mdi-light--cog]',
  'icon-[mdi-light--view-dashboard]',
]

export default function Page() {
  return (
    <>
      <IconcatAppRouterPageStylesheets manifest={iconcatManifest} page={pageRoute} />
      <HomePanel
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
            'The route path "/" is resolved through manifest.pageRoutes to the generated App Router page entry.',
            'layout.tsx is used by every resolved App Router page, so Iconcat auto-promotes Home to shell CSS.',
            'This route still emits a page CSS entry, but icons already present in global CSS are subtracted.',
          ],
          previewLabel: getIconcatPreviewLabel(),
        }}
        routeLink={renderRouteLink}
      />
    </>
  )
}
