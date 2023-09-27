/* eslint-disable no-console */
import 'cross-fetch/polyfill'
import { importFromFigma, mergeIconSets } from '@iconify/tools'

import {
  COLORED_POSTFIX,
  normalizeName,
  optimizeIconSet,
} from '../../helpers/icon-set'

import type { IconSet } from '@iconify/tools'

export interface ImportFigmaIconSetOptions {
  /**
   * Figma files
   */
  files: {
    /** https://iconify.design/docs/libraries/tools/import/figma/file-id.html */
    id: string
    /**
     * Icon set prefix, if a icon named start with the prefix, it will be imported.
     *
     * For example, set prefix with "iconify", "iconify-apple" will be imported.
     *
     * ref: https://iconify.design/docs/libraries/tools/import/figma/#options
     */
    prefix: string
  }[]
  /**
   * Figma token
   *
   * token: https://iconify.design/docs/libraries/tools/import/figma/token.html
   */
  token: string
  /**
   * Whether cache figma data to `.figma-cache`, default: false.
   */
  cache?: boolean
  /** Colors will be preserved under the 'FRAME' | 'GROUP' | 'SECTION', named with `preserveColorsGroup` */
  preserveColorsGroup?: string
}

/** Icon component in Figma will be imported */
export async function importFigmaIconSets(options: ImportFigmaIconSetOptions) {
  const { files, token, cache = false, preserveColorsGroup } = options

  if (typeof token !== 'string') {
    throw new TypeError('token type error')
  }
  if (!token) {
    throw new Error('token not found')
  }

  async function importFile(fileId: string, prefix: string) {
    const result = await importFromFigma({
      prefix,
      file: fileId,
      token,
      cacheDir: cache ? '.figma-cache' : undefined,
      /** Support node type: 'FRAME' | 'COMPONENT' | 'INSTANCE' */
      iconNameForNode: (node) => {
        if (!['COMPONENT', 'INSTANCE', 'FRAME'].includes(node.type)) {
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

  const iconSetsResult = await Promise.allSettled(
    files.map(async (item) => {
      return await importFile(item.id, item.prefix)
    }),
  )

  const okIconSets: IconSet[] = []

  for (const [index, item] of iconSetsResult.entries()) {
    if (item.status === 'fulfilled') {
      okIconSets.push(item.value)
      console.log(`file id: ${files[index].id} import success.`)
    } else {
      console.error(`file id: ${files[index].id} import failed:`, item.reason)
    }
  }

  console.log(
    `Icon sets imported: ${okIconSets.length}, failed: ${
      files.length - okIconSets.length
    }`,
  )

  const iconSetsMap = okIconSets.reduce((previous, current) => {
    return {
      ...previous,
      [current.prefix]:
        current.prefix in previous
          ? [...previous[current.prefix], current]
          : [current],
    }
  }, {} as Record<string, IconSet[]>)

  const mergedIconSets: IconSet[] = []

  Object.keys(iconSetsMap).forEach((prefix) => {
    const prefixIconSets = iconSetsMap[prefix]
    if (prefixIconSets.length === 1) {
      mergedIconSets.push(iconSetsMap[prefix][0])
      return
    }

    mergedIconSets.push(
      prefixIconSets.slice(1).reduce((previous, current) => {
        return mergeIconSets(previous, current)
      }, prefixIconSets[0]),
    )
  })

  if (mergedIconSets.length !== okIconSets.length) {
    console.log(
      `Merged icon sets from ${okIconSets.length} to ${mergedIconSets.length}`,
    )
  }

  return mergedIconSets
}
