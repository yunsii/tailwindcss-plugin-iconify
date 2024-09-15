import { importFromFigma, mergeIconSets } from '@iconify/tools'
import consola from 'consola'

import type { IconSet } from '@iconify/tools'
import type { DocumentNotModified } from '@iconify/tools/lib/download/types/modified.js'
import type { FigmaImportOptions } from '@iconify/tools/lib/import/figma/types/options.js'

import {
  COLORED_POSTFIX,
  normalizeColoredName,
  optimizeIconSet,
} from '../../helpers/icon-set'

import 'cross-fetch/polyfill'

export interface FigmaIconifyFile {
  /** ref: https://iconify.design/docs/libraries/tools/import/figma/file-id.html */
  id: FigmaImportOptions['file']
  /** @deprecated Even specific pages, it still download full file, recommend to use `nodeIds` instead */
  pages?: FigmaImportOptions['pages']
  /** ref: https://iconify.design/docs/libraries/tools/import/figma/#options-for-finding-icons-in-figma-document */
  nodeIds?: FigmaImportOptions['ids']
  /**
   * Icon set prefix, if a icon named start with the prefix, it will be imported.
   *
   * For example, set prefix with "iconify", "iconify-apple" will be imported.
   *
   * If icons have the same names, it will be merged into one icon.
   *
   * ref: https://iconify.design/docs/libraries/tools/import/figma/#options
   */
  prefix: FigmaImportOptions['prefix']
}

export interface ImportFigmaIconSetOptions {
  /**
   * Figma files
   */
  files: FigmaIconifyFile[]
  /**
   * Figma token
   *
   * token: https://iconify.design/docs/libraries/tools/import/figma/token.html
   */
  token: string
  /**
   * Whether cache figma data to `.figma-cache`, default: false.
   *
   * If you use cache, you can set `cacheOptions.ifModifiedSince: true` also,
   * except you have duplicated `files.id`
   */
  cache?: boolean
  /**
   * ref: https://iconify.design/docs/libraries/tools/import/figma/#cache-options
   */
  cacheOptions?: Pick<
    FigmaImportOptions,
    'cacheAPITTL' | 'cacheSVGTTL' | 'ifModifiedSince'
  >
  /**
   * Colors will be preserved under the 'FRAME' | 'GROUP' | 'SECTION', named with `preserveColorsGroup`
   *
   * For example, set preserveColorsGroup with "colored",
   * icons colors will be preserved under named with "colored" 'FRAME' | 'GROUP' | 'SECTION' node.
   */
  preserveColorsGroup?: string
}

/** Icon component in Figma will be imported */
export async function importFigmaIconSets(options: ImportFigmaIconSetOptions) {
  const {
    files,
    token,
    cache = false,
    cacheOptions,
    preserveColorsGroup,
  } = options

  if (typeof token !== 'string') {
    throw new TypeError('token type error')
  }
  if (!token) {
    throw new Error('token not found')
  }

  async function importFigmaFile(
    file: FigmaIconifyFile,
  ): Promise<IconSet | DocumentNotModified> {
    const { id, pages, nodeIds, prefix } = file

    const result = await importFromFigma({
      prefix,
      file: id,
      ids: nodeIds,
      pages,
      token,
      cacheDir: cache ? `.figma-cache/${prefix}` : undefined,
      ...cacheOptions,
      /** Support node type: 'FRAME' | 'COMPONENT' | 'INSTANCE' */
      iconNameForNode: (node) => {
        if (!['COMPONENT', 'INSTANCE', 'FRAME'].includes(node.type)) {
          return
        }
        if (node.name.startsWith(`${prefix}-`)) {
          const nameRegExp = /^[a-z]([a-z0-9\-])*[a-z0-9]$/
          if (!nameRegExp.test(node.name)) {
            throw new Error(
              `Unexpected icon name: ${node.name}, regexp: ${nameRegExp}`,
            )
          }
          const newName = node.name.replace(`${prefix}-`, '')
          const unexpectedHyphensRegExp = /-{2,}/
          if (unexpectedHyphensRegExp.test(newName)) {
            throw new Error(
              `Unexpected icon name: ${node.name}, contains duplicate hyphens`,
            )
          }

          if (
            preserveColorsGroup
            && node.parents.some((item) => {
              return (
                ['FRAME', 'GROUP', 'SECTION'].includes(item.type)
                && item.name.trim() === preserveColorsGroup
              )
            })
          ) {
            consola.log('colored icon', node.name)
            return `${newName}${COLORED_POSTFIX}`
          }
          consola.log('icon', node.name)
          return newName
        }
      },
    })

    if (typeof result === 'string') {
      return result
    }

    const iconSet = result.iconSet

    optimizeIconSet(iconSet, {
      preserveColors: ({ iconName }) => {
        return iconName.endsWith(COLORED_POSTFIX)
      },
    })

    iconSet.forEach((name) => {
      if (name.endsWith(COLORED_POSTFIX)) {
        iconSet.rename(name, normalizeColoredName(name))
      }
    })

    return iconSet
  }

  const iconSetsResult = await Promise.allSettled(
    files.map(async (item) => {
      return await importFigmaFile(item)
    }),
  )

  const okIconSets: IconSet[] = []

  for (const [index, item] of iconSetsResult.entries()) {
    if (item.status === 'fulfilled') {
      if (item.value === 'not_modified') {
        consola.log(`file id: ${files[index].id} not modified.`)
        continue
      }
      okIconSets.push(item.value)
      consola.log(`file id: ${files[index].id} import success.`)
    } else {
      consola.error(`file id: ${files[index].id} import failed:`, item.reason)
    }
  }

  consola.log(
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
    consola.log(
      `Merged icon sets from ${okIconSets.length} to ${mergedIconSets.length}`,
    )
  }

  return mergedIconSets
}
