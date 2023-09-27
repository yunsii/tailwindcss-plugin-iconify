import {
  cleanupSVG,
  isEmptyColor,
  parseColorsSync,
  runSVGO,
} from '@iconify/tools'
import { specialColorAttributes } from '@iconify/tools/lib/colors/attribs'
import { parseIconSet } from '@iconify/utils'
import { getIconsCSSData } from '@iconify/utils/lib/css/icons'

import { transformCSSDataToRules } from '../dynamic'
import { ensureLoadIconSet } from '../loader'

import type { ExtendedTagElementWithColors } from '@iconify/tools/lib/colors/parse'
import type { Color } from '@iconify/utils/lib/colors/types'
import type { ColorAttributes } from '@iconify/tools/lib/colors/attribs'
import type { IconSet } from '@iconify/tools'
import type { DynamicIconifyPluginOptions } from '../options'

// colored icon do not support change icon color
export const COLORED_POSTFIX = '__colored'

export function normalizeColoredName(name: string) {
  return name.replace(COLORED_POSTFIX, '')
}

export type PreserveColorsFn = (data: {
  iconName: string
  attr: ColorAttributes
  colorString: string
  parsedColor: Color | null
  tagName?: string
  item?: ExtendedTagElementWithColors
}) => boolean | void

export interface OptimizeIconSetOptions {
  preserveColors?: PreserveColorsFn
}

export function optimizeIconSet(
  iconSet: IconSet,
  options: OptimizeIconSetOptions = {},
) {
  const { preserveColors } = options

  iconSet.forEachSync((name, type) => {
    if (type !== 'icon') {
      return
    }

    // Get SVG object for icon
    const svg = iconSet.toSVG(name)
    if (!svg) {
      // Invalid icon
      iconSet.remove(name)
      return
    }

    try {
      // Clean up icon
      cleanupSVG(svg)

      // This is a monotone icon, change color to `currentColor`, add it if missing
      // Skip this step if icons have palette
      parseColorsSync(svg, {
        defaultColor: 'currentColor',
        callback: (attr, colorString, parsedColor, tagName, item) => {
          if (
            specialColorAttributes.includes(attr as any) ||
            (preserveColors &&
              !!preserveColors({
                iconName: name,
                attr,
                colorString,
                parsedColor,
                tagName,
                item,
              }))
          ) {
            return colorString
          }
          const result =
            !parsedColor || isEmptyColor(parsedColor)
              ? colorString
              : 'currentColor'
          return result
        },
      })

      // Optimize icon
      runSVGO(svg, {
        cleanupIDs: (id) => {
          return `${normalizeColoredName(name)}_${id}`
        },
      })
    } catch (err) {
      // Something went wrong when parsing icon: remove it
      console.error(`Error parsing ${name}:`, err)
      iconSet.remove(name)
      return
    }

    // Update icon in icon set from SVG object
    iconSet.fromSVG(name, svg)
  })
}

export interface GetIconSetIconStylesOptions {
  pluginOptions: DynamicIconifyPluginOptions
  staticIconNames?: string[]
}

export function getIconSetIconStyles(
  iconSetName: string,
  options: GetIconSetIconStylesOptions,
) {
  const { pluginOptions, staticIconNames } = options

  const values: Record<string, Record<string, string>> = {}
  const iconSet = ensureLoadIconSet(iconSetName, pluginOptions)
  parseIconSet(iconSet, (name, data) => {
    if (!data) {
      return
    }
    if (staticIconNames && !staticIconNames.includes(name)) {
      return
    }

    const generated = getIconsCSSData(iconSet, [name], {
      iconSelector: '.icon',
    })

    values[`${iconSetName}--${name}`] = transformCSSDataToRules(
      generated,
      pluginOptions,
    )
  })

  return values
}
