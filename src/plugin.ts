import plugin from 'tailwindcss/plugin'
import { parseIconSet } from '@iconify/utils'
import { getIconsCSSData } from '@iconify/utils/lib/css/icons'

import { getCSSRulesForIcons } from './clean'
import { getDynamicCSSRules, transformCSSDataToRules } from './dynamic'
import { ensureLoadIconSet } from './loader'

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
        type: 'custom',
      }
    }),
    ...preprocessSets.map((item) => {
      return {
        iconSetName: item,
        type: 'preset',
      }
    }),
  ]

  const values: Record<string, Record<string, string>> = {}
  mergedPreprocessSets.forEach((item) => {
    const iconSet = ensureLoadIconSet(item.iconSetName, options)
    parseIconSet(iconSet, (name, data) => {
      if (!data) {
        return
      }

      const generated = getIconsCSSData(iconSet, [name], {
        iconSelector: '.icon',
      })

      values[`${item.iconSetName}--${name}`] = transformCSSDataToRules(
        generated,
        options,
      )
    })
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
        values,
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
