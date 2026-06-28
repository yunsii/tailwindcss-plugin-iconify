import process from 'node:process'

import { getIconcatNextAppRouterPageCSSFilesFromManifest, getNextIconcatCSSHref, readIconcatManifestSync } from '@iconcat/next'

import type { DemoCSSFile } from '@iconcat/example-fixtures/dashboard'
import type { IconcatPageRoute } from '@iconcat/next'

const isDevelopment = process.env.NODE_ENV !== 'production'
export const iconcatManifest = process.env.ICONCAT_MANIFEST || '.iconcat/manifest.json'

const demoIconClasses = [
  'icon-[line-md--loading-loop]',
  'icon-[mdi-light--calendar]',
  'icon-[mdi-light--chart-line]',
  'icon-[mdi-light--cog]',
  'icon-[mdi-light--home]',
  'icon-[mdi-light--folder]',
  'icon-[mdi-light--view-dashboard]',
]

export function getIconcatCSSHref() {
  if (isDevelopment) {
    return undefined
  }

  return getNextIconcatCSSHref({ manifest: iconcatManifest })
}

export function getIconcatPageCSSHref(page: IconcatPageRoute) {
  if (isDevelopment) {
    return undefined
  }

  return getIconcatAppRouterPageCSSFiles(page)[0]?.href
}

export function getIconcatCSSFiles(page: IconcatPageRoute): DemoCSSFile[] {
  if (isDevelopment) {
    return [
      {
        href: 'dev server injected CSS',
        label: 'Tailwind dynamic icon selectors',
        source: 'dev',
      },
    ]
  }

  return [
    {
      href: getIconcatCSSHref(),
      label: 'global shell icons',
      source: 'global',
    },
    ...getIconcatAppRouterPageCSSFiles(page).map((file, index) => ({
      href: file.href,
      label: index === 0 ? 'route and ancestor icons' : 'additional route icons',
      source: 'page' as const,
    })),
  ]
}

export function getIconcatCSSLoading(productionLoading: string) {
  return isDevelopment
    ? 'development: Tailwind dynamic icon selectors from the dev server; catalog CSS is not linked'
    : productionLoading
}

export function getIconcatIconSources(pageIconClasses: string[]) {
  return isDevelopment
    ? {
        devIconClasses: demoIconClasses,
        globalIconClasses: [],
        pageIconClasses: [],
      }
    : {
        globalIconClasses: ['icon-[mdi-light--home]'],
        pageIconClasses,
      }
}

export function getIconcatPreviewLabel() {
  return isDevelopment ? 'development preview' : 'production preview'
}

function getIconcatAppRouterPageCSSFiles(page: IconcatPageRoute) {
  return getIconcatNextAppRouterPageCSSFilesFromManifest(
    readIconcatManifestSync({ manifest: iconcatManifest }),
    page,
  )
}
