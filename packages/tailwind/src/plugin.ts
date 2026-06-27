import { normalizeCatalogIcons, normalizeIconcatCatalog } from '@iconcat/core'
import plugin from 'tailwindcss/plugin'

import type {
  IconcatCatalog,
} from '@iconcat/core'

import { getCSSRulesForIcons } from './clean'
import { getDynamicCSSRules } from './dynamic'
import { getIconSetIconStyles } from './helpers/icon-set'

import type {
  CatalogIconsOptions,
  DynamicIconsOptions,
  IconCatalogInput,
  IconsOptions,
  StaticIconsOptions,
} from './options'

export {
  createIconcatCSSArtifact,
  generateIconcatCSS,
} from './catalog-css'
export type { IconcatCSSArtifact, IconcatCSSArtifactInput, IconcatCSSArtifactOptions } from './catalog-css'
export { optimizeIconSet } from './helpers/icon-set'

/**
 * Generate styles for runtime selector: class="icon-[mdi-light--home]"
 */
export function dynamicIcons(
  options: DynamicIconsOptions = {},
) {
  return createIconsPlugin(options)
}

/**
 * Generate styles for runtime selectors and optional static class names.
 */
export function icons(
  options: IconsOptions = {},
) {
  return createIconsPlugin(options)
}

function createIconsPlugin(
  options: IconsOptions = {},
) {
  const { prefix = 'icon', static: staticIcons = [], iconSets = {} } = options

  let iconStyles: Record<string, Record<string, string>> = {}

  const mergedStaticIconNames: Record<string, string[] | '*' | null> = {
    // Load all icon styles for custom iconSets by default
    ...(Object.keys(iconSets).reduce(
      (acc, iconSetName) => {
        return {
          ...acc,
          [iconSetName]: '*',
        }
      },
      {},
    )),
    ...(Array.isArray(staticIcons)
      ? staticIcons.reduce(
          (acc, item) => {
            return {
              ...acc,
              [item]: '*',
            }
          },
          {},
        )
      : staticIcons),
  }

  Object.keys(mergedStaticIconNames).forEach((iconSetName) => {
    const staticIconNames = mergedStaticIconNames[iconSetName]
    const iconSetIconStyles = getIconSetIconStyles(iconSetName, {
      pluginOptions: options,
      staticIconNames,
    })
    iconStyles = {
      ...iconStyles,
      ...iconSetIconStyles,
    }
  })

  return plugin(({ matchComponents }) => {
    matchComponents(
      {
        [prefix]: (icon) => {
          if (typeof icon === 'string') {
            return getDynamicCSSRules(icon, options)
          }
          return icon
        },
      },
      {
        values: iconStyles,
      },
    )
  })
}

/**
 * Generate styles for a fixed list of icons.
 */
export function staticIcons(
  icons: string[] | string,
  options?: StaticIconsOptions,
) {
  const rules = getCSSRulesForIcons(icons, options)
  return plugin(({ addUtilities }) => {
    addUtilities(rules)
  })
}

/**
 * Generate styles for icons listed in an Iconcat catalog.
 */
export function catalogIcons(
  catalog: IconCatalogInput,
  options: CatalogIconsOptions = {},
) {
  const staticIconNames = isIconcatCatalog(catalog)
    ? normalizeIconcatCatalog(catalog).icons
    : normalizeCatalogIcons(catalog)

  return icons({
    ...options,
    static: staticIconNames,
  })
}

function isIconcatCatalog(
  catalog: IconCatalogInput,
): catalog is IconcatCatalog {
  return 'version' in catalog && 'icons' in catalog
}

/**
 * Export types
 */
export type {
  CatalogIconsOptions,
  DynamicIconsOptions,
  IconCatalogInput,
  IconsOptions,
  StaticIconsOptions,
}

export type * as TwConfig from 'tailwindcss/types/config'
