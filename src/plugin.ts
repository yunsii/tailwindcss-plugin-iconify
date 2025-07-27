import plugin from 'tailwindcss/plugin'

import { getCSSRulesForIcons } from './clean'
import { getDynamicCSSRules } from './dynamic'
import { getIconSetIconStyles } from './helpers/icon-set'

import type {
  CleanIconifyPluginOptions,
  DynamicIconifyPluginOptions,
} from './options'

export { optimizeIconSet } from './helpers/icon-set'

/**
 * Generate styles for dynamic selector: class="icon-[mdi-light--home]"
 */
export function addDynamicIconSelectors(
  options: DynamicIconifyPluginOptions = {},
) {
  const { prefix = 'icon', preprocessSets = [], iconSets = {} } = options

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
    ...(Array.isArray(preprocessSets)
      ? preprocessSets.reduce(
        (acc, item) => {
          return {
            ...acc,
            [item]: '*',
          }
        },
        {},
      )
      : preprocessSets),
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
 * Generate styles for preset list of icons
 */
export function addCleanIconSelectors(
  icons: string[] | string,
  options?: CleanIconifyPluginOptions,
) {
  const rules = getCSSRulesForIcons(icons, options)
  return plugin(({ addUtilities }) => {
    addUtilities(rules)
  })
}

/**
 * Export types
 */
export type { CleanIconifyPluginOptions, DynamicIconifyPluginOptions }

export type * as TwConfig from 'tailwindcss/types/config'
