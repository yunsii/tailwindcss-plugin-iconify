import {
  cleanupSVG,
  isEmptyColor,
  parseColorsSync,
  runSVGO,
} from '@iconify/tools'
import { specialColorAttributes } from '@iconify/tools/lib/colors/attribs'

import type { ExtendedTagElementWithColors } from '@iconify/tools/lib/colors/parse'
import type { Color } from '@iconify/utils/lib/colors/types'
import type { ColorAttributes } from '@iconify/tools/lib/colors/attribs'
import type { IconSet } from '@iconify/tools'

export type PreserveColorsFn = (options: {
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
      runSVGO(svg)
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
