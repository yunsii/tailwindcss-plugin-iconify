import {
  cleanupSVG,
  importDirectorySync,
  isEmptyColor,
  parseColorsSync,
  runSVGO,
} from '@iconify/tools'
import { specialColorAttributes } from '@iconify/tools/lib/colors/attribs'
import pathe from 'pathe'

import type { Color } from '@iconify/utils/lib/colors/types'
import type { ExtendedTagElementWithColors } from '@iconify/tools/lib/colors/parse'
import type { ColorAttributes } from '@iconify/tools/lib/colors/attribs'
import type { IconifyJSON } from '@iconify/types'

export interface GetLocalIconSetsOptions {
  define: Record<
    string,
    | string
    | {
        path: string
        options?: Parameters<typeof importDirectorySync>[1]
      }
  >
  /** Custom colors should preserved, Do not transform to `currentColor` */
  preserveColors?: (options: {
    attr: ColorAttributes
    colorString: string
    parsedColor: Color | null
    tagName?: string
    item?: ExtendedTagElementWithColors
  }) => boolean
}

/** ref: https://iconify.design/docs/libraries/tools/import/directory.html */
export function getLocalIconSets(options: GetLocalIconSetsOptions) {
  const { define: iconSetMaps, preserveColors } = options

  return Object.keys(iconSetMaps).reduce((prev, current) => {
    const value = iconSetMaps[current]
    const _path = typeof value === 'string' ? value : value.path
    const options = typeof value === 'string' ? undefined : value.options

    const customSet = importDirectorySync(pathe.normalize(_path), options)

    // Clean up all icons
    customSet.forEachSync((name, type) => {
      if (type !== 'icon') {
        return
      }

      // Get SVG object for icon
      const svg = customSet.toSVG(name)
      if (!svg) {
        // Invalid icon
        customSet.remove(name)
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
                preserveColors({
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
        customSet.remove(name)
        return
      }

      // Update icon in icon set from SVG object
      customSet.fromSVG(name, svg)
    })

    return {
      ...prev,
      [current]: customSet.export(),
    }
  }, {} as Record<string, IconifyJSON>)
}
