import { importDirectorySync } from '@iconify/tools'
import pathe from 'pathe'

import { loadIconifyJsonPath, optimizeIconSet } from '../helpers/icon-set'

import type { IconifyJSON } from '@iconify/types'
import type { PreserveColorsFn } from '../helpers/icon-set'

export interface GetLocalIconSetsOptions {
  /**
   * if value type is `string`, it will import all icons from the directory
   *
   * ref: https://iconify.design/docs/libraries/tools/import/directory.html
   */
  define: Record<
    string,
    | string
    | {
        /**
         * Import all icons from directory
         *
         * ref: https://iconify.design/docs/libraries/tools/import/directory.html
         */
        path: string
        options?: Parameters<typeof importDirectorySync>[1]
        /** Custom colors should preserved, Do not transform to `currentColor` */
        preserveColors?: PreserveColorsFn
      }
    | {
        /**
         * Importing Iconify icon set by `IconifyJSON`
         */
        iconifyJsonPath: string
      }
  >
}

/** ref: https://iconify.design/docs/libraries/tools/import/directory.html */
export function getLocalIconSets(options: GetLocalIconSetsOptions) {
  const { define: iconSetMaps } = options

  return Object.keys(iconSetMaps).reduce((prev, current) => {
    const iconSetConfig = iconSetMaps[current]

    if (
      typeof iconSetConfig !== 'string' &&
      'iconifyJsonPath' in iconSetConfig
    ) {
      const iconSet = loadIconifyJsonPath(iconSetConfig.iconifyJsonPath)

      if (iconSet) {
        return {
          ...prev,
          [current]: iconSet.export(),
        }
      }
      return prev
    }

    const _path =
      typeof iconSetConfig === 'string' ? iconSetConfig : iconSetConfig.path
    const options =
      typeof iconSetConfig === 'string' ? undefined : iconSetConfig.options
    const preserveColors =
      typeof iconSetConfig === 'string'
        ? undefined
        : iconSetConfig.preserveColors

    const customIconSet = importDirectorySync(pathe.normalize(_path), options)

    optimizeIconSet(customIconSet, {
      preserveColors,
    })

    return {
      ...prev,
      [current]: customIconSet.export(),
    }
  }, {} as Record<string, IconifyJSON>)
}
