/* eslint-disable react-refresh/only-export-components */
import { HomePanel } from '@iconcat/example-fixtures/home'

import { getIconcatCSSLoading } from '../page-props'
import { createIconcatStaticProps } from '../page-static-props'
import { IconcatPageStylesheet } from '../page-stylesheet'
import { renderRouteLink } from '../route-link'

import type { IconcatPageProps } from '../page-props'

const pageRoute = '/'

export const getStaticProps = createIconcatStaticProps(pageRoute)

const pageIconClasses = [
  'icon-[line-md--loading-loop]',
  'icon-[mdi-light--cog]',
  'icon-[mdi-light--view-dashboard]',
]

export default function Page({
  devIconClasses,
  iconcatCSSFiles,
  iconcatCSSHref,
  iconcatPageCSSFiles,
  iconcatPageCSSHref,
  previewLabel,
}: IconcatPageProps) {
  return (
    <>
      <IconcatPageStylesheet files={iconcatPageCSSFiles} />
      <HomePanel
        meta={{
          appType: 'Next.js Pages Router',
          routerType: 'Pages Router',
          cssHref: [iconcatCSSHref, iconcatPageCSSHref].filter(Boolean).join(' + '),
          cssFiles: iconcatCSSFiles,
          cssTarget: '.next/static/css/iconcat.[hash].css',
          cssLoading: getIconcatCSSLoading(
            'page manifest: global CSS in _document + page CSS in next/head',
            devIconClasses,
          ),
          catalogMode: 'page icon CSS mode',
          devIconClasses,
          globalIconClasses: devIconClasses.length ? [] : ['icon-[mdi-light--home]'],
          observability: [
            '_app.tsx is auto-promoted to global icon CSS, so Home is loaded through _document.',
            'getStaticProps resolves the route path "/" through manifest.pageRoutes before rendering.',
          ],
          pageIconClasses: devIconClasses.length ? [] : pageIconClasses,
          previewLabel,
        }}
        routeLink={renderRouteLink}
      />
    </>
  )
}
