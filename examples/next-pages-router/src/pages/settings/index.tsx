/* eslint-disable react-refresh/only-export-components */
import { SettingsPanel } from '@iconcat/example-fixtures/settings'

import { getIconcatCSSLoading } from '../../page-props'
import { createIconcatServerSideProps } from '../../page-server-props'
import { IconcatPageStylesheet } from '../../page-stylesheet'
import { renderRouteLink } from '../../route-link'

import type { IconcatPageProps } from '../../page-props'

const pageEntry = 'src/pages/settings/index.tsx'

export const getServerSideProps = createIconcatServerSideProps(pageEntry)

const pageIconClasses = [
  'icon-[line-md--loading-loop]',
  'icon-[mdi-light--cog]',
  'icon-[mdi-light--view-dashboard]',
]

export default function SettingsPage({
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
      <SettingsPanel
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
            'settings/index.tsx emits Settings and shared loading icons into page CSS.',
            'getServerSideProps resolves the page CSS href for each request before rendering.',
          ],
          pageIconClasses: devIconClasses.length ? [] : pageIconClasses,
          previewLabel,
        }}
        routeLink={renderRouteLink}
      />
    </>
  )
}
