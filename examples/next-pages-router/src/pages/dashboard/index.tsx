/* eslint-disable react-refresh/only-export-components */
import { DashboardPanel } from '@iconcat/example-fixtures/dashboard-panel'
import { defineIconcatIcons } from 'iconcat/runtime'

import { getIconcatCSSLoading } from '../../page-props'
import { createIconcatStaticProps } from '../../page-static-props'
import { IconcatPageStylesheet } from '../../page-stylesheet'
import { renderRouteLink } from '../../route-link'

import type { IconcatPageProps } from '../../page-props'

const pageEntry = 'src/pages/dashboard/index.tsx'

export const getStaticProps = createIconcatStaticProps(pageEntry)

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

export default function DashboardPage({
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
      <DashboardPanel
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
          devIconClasses,
          globalIconClasses: devIconClasses.length ? [] : ['icon-[mdi-light--home]'],
          observability: [
            '_app.tsx is auto-promoted to global icon CSS, so Home is loaded through _document.',
            'dashboard/index.tsx emits the dashboard route icon and configurable allowlist icons into page CSS.',
            'getStaticProps resolves the page CSS href at build time before HTML generation.',
          ],
          pageIconClasses: devIconClasses.length ? [] : pageIconClasses,
          previewLabel,
        }}
        routeLink={renderRouteLink}
      />
    </>
  )
}
