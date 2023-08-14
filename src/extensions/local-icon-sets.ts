import {
  cleanupSVG,
  importDirectorySync,
  isEmptyColor,
  parseColorsSync,
  runSVGO,
} from '@iconify/tools'
import { specialColorAttributes } from '@iconify/tools/lib/colors/attribs'
import pathe from 'pathe'

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
}

export function getLocalIconSets(options: GetLocalIconSetsOptions) {
  const iconSetMaps = options.define

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
          callback: (attr, colorStr, color, tagName, item) => {
            if (specialColorAttributes.includes(attr as any)) {
              return colorStr
            }
            const result =
              !color || isEmptyColor(color) ? colorStr : 'currentColor'
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
