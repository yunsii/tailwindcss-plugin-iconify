/* eslint-disable no-console */
import 'cross-fetch/polyfill'
import { importFromFigma } from '@iconify/tools'

import {
  COLORED_POSTFIX,
  normalizeName,
  optimizeIconSet,
} from '../../helpers/icon-set'

export interface LoadFigmaIconSetOptions {
  /**
   * Figma file id
   *
   * ref: https://iconify.design/docs/libraries/tools/import/figma/file-id.html
   */
  fileId: string
  /**
   * Figma token
   *
   * token: https://iconify.design/docs/libraries/tools/import/figma/token.html
   */
  token: string
  /**
   * Icon set prefix, if a icon named start with the prefix, it will be loaded.
   *
   * For example, set prefix with "iconify", "iconify-apple" will be loaded.
   *
   * ref: https://iconify.design/docs/libraries/tools/import/figma/#options
   */
  prefix: string
  /**
   * Cache figma data to `.figma-cache`
   */
  cache?: boolean
  /** Colors will be preserved under the 'FRAME' | 'GROUP' | 'SECTION' */
  preserveColorsGroup?: string
}

/** Icon component in Figma will be loaded */
export async function loadFigmaIconSet(options: LoadFigmaIconSetOptions) {
  const { fileId, token, prefix, cache = false, preserveColorsGroup } = options

  if (typeof token !== 'string') {
    throw new TypeError('token type error')
  }
  if (!token) {
    throw new Error('token not found')
  }

  // Import icons
  const result = await importFromFigma({
    prefix,
    file: fileId,
    token,
    cacheDir: cache ? '.figma-cache' : undefined,
    /** Support node type: 'FRAME' | 'COMPONENT' | 'INSTANCE' */
    iconNameForNode: (node) => {
      if (!['COMPONENT', 'INSTANCE'].includes(node.type)) {
        return
      }
      if (node.name.startsWith(`${prefix}-`)) {
        const newName = node.name.replace(`${prefix}-`, '')
        if (
          preserveColorsGroup &&
          node.parents.some((item) => {
            return (
              ['FRAME', 'GROUP', 'SECTION'].includes(item.type) &&
              item.name.trim() === preserveColorsGroup
            )
          })
        ) {
          console.log('colored icon', node.name)
          return `${newName}${COLORED_POSTFIX}`
        }
        console.log('icon', node.name)
        return newName
      }
    },
  })

  const iconSet = result.iconSet

  optimizeIconSet(iconSet, {
    preserveColors: ({ iconName }) => {
      return iconName.endsWith(COLORED_POSTFIX)
    },
  })

  iconSet.forEach((name) => {
    if (name.endsWith(COLORED_POSTFIX)) {
      iconSet.rename(name, normalizeName(name))
    }
  })

  return iconSet
}
