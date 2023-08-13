import path from 'node:path'

import {
  cleanupSVG,
  importDirectorySync,
  isEmptyColor,
  parseColorsSync,
  runSVGO,
} from '@iconify/tools'
import { specialColorAttributes } from '@iconify/tools/lib/colors/attribs'

import { addDynamicIconSelectors } from './src/plugin'

import type { Config } from 'tailwindcss'

// Import icons from directory 'svg'
const customSet = importDirectorySync(path.join(__dirname, './assets'))

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
        const result = !color || isEmptyColor(color) ? colorStr : 'currentColor'
        return result
      },
    })

    // Optimise icon
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

const config: Config = {
  content: ['./docs/**/*.tsx', './docs/**/*.mdx'],
  theme: {
    extend: {},
  },
  plugins: [
    addDynamicIconSelectors({
      prefix: 'i',
      iconSets: {
        custom: customSet.export(),
      },
      preprocessSets: ['mdi', 'svg-spinners'],
    }),
    addDynamicIconSelectors({
      // `ih` abbr for `icon-hover`
      prefix: 'ih',
      iconSets: {
        custom: customSet.export(),
      },
      preprocessSets: ['mdi'],
      overrideOnly: true,
    }),
  ],
}

export default config
