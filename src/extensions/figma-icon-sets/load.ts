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
   * Icon set prefix
   *
   * ref: https://iconify.design/docs/libraries/tools/import/figma/#options
   */
  prefix: string
  /**
   * Cache figma data to `.figma-cache`
   */
  cache?: boolean
  /** Colors will be preserved under the group */
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
    iconNameForNode: (node) => {
      if (node.type !== 'COMPONENT') {
        return
      }
      if (node.name.startsWith(`${prefix}-`)) {
        const newName = node.name.replace(`${prefix}-`, '')
        if (
          preserveColorsGroup &&
          node.parents.some((item) => {
            return (
              item.type === 'GROUP' && item.name.trim() === preserveColorsGroup
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
