import type { DemoCSSFile } from '@iconcat/example-fixtures/dashboard'
import type { IconcatCSSManifestFile } from '@iconcat/next'

export const demoIconClasses = [
  'icon-[line-md--loading-loop]',
  'icon-[mdi-light--calendar]',
  'icon-[mdi-light--chart-line]',
  'icon-[mdi-light--cog]',
  'icon-[mdi-light--home]',
  'icon-[mdi-light--view-dashboard]',
]

export interface IconcatPageProps {
  devIconClasses: string[]
  iconcatCSSHref: string | null
  iconcatCSSFiles: DemoCSSFile[]
  iconcatPageCSSFiles: IconcatCSSManifestFile[]
  iconcatPageCSSHref: string | null
  previewLabel: string
}

export function getIconcatCSSLoading(
  productionLoading: string,
  devIconClasses: string[],
) {
  const isDevelopment = devIconClasses.length > 0

  return isDevelopment
    ? 'development: Tailwind dynamic icon selectors from the dev server; catalog CSS is not linked'
    : productionLoading
}

export function getIconcatCSSFiles(
  iconcatCSSHref: string | null,
  iconcatPageCSSHref: string | null,
  isDevelopment: boolean,
): DemoCSSFile[] {
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
    iconcatCSSHref
      ? {
          href: iconcatCSSHref,
          label: 'global shell icons',
          source: 'global' as const,
        }
      : undefined,
    iconcatPageCSSHref
      ? {
          href: iconcatPageCSSHref,
          label: 'current route icons',
          source: 'page' as const,
        }
      : undefined,
  ].filter(isDefined)
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}
