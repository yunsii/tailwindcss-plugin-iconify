import plugin from 'tailwindcss/plugin'

import { getCSSRulesForIcons } from './clean'
import { getDynamicCSSRules } from './dynamic'
import { getIconSetIconStyles } from './helpers/icon-set'

import type {
  CleanIconifyPluginOptions,
  DynamicIconifyPluginOptions,
} from './options'

/**
 * Generate styles for dynamic selector: class="icon-[mdi-light--home]"
 */
export function addDynamicIconSelectors(
  options: DynamicIconifyPluginOptions = {},
) {
  const { prefix = 'icon', preprocessSets = [], iconSets = {} } = options

  const mergedPreprocessSets = [
    ...Object.keys(iconSets).map((item) => {
      return {
        iconSetName: item,
      }
    }),
    ...(Array.isArray(preprocessSets)
      ? preprocessSets.map((item) => {
        return {
          iconSetName: item,
        }
      })
      : []),
  ]

  let iconStyles: Record<string, Record<string, string>> = {}
  mergedPreprocessSets.forEach((item) => {
    const iconSetIconStyles = getIconSetIconStyles(item.iconSetName, {
      pluginOptions: options,
    })
    iconStyles = {
      ...iconStyles,
      ...iconSetIconStyles,
    }
  })
  if (!Array.isArray(preprocessSets)) {
    Object.keys(preprocessSets).forEach((iconSetName) => {
      const staticIconNames = preprocessSets[iconSetName]
      const iconSetIconStyles = getIconSetIconStyles(iconSetName, {
        pluginOptions: options,
        staticIconNames:
          typeof staticIconNames === 'string' ? null : staticIconNames,
      })
      iconStyles = {
        ...iconStyles,
        ...iconSetIconStyles,
      }
    })
  }

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

export { optimizeIconSet } from './helpers/icon-set'
