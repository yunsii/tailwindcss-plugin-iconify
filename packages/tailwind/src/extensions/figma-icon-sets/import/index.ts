import { mergeIconSets } from '@iconify/tools'

import type { IconSet } from '@iconify/tools'

import { logger } from '../helpers/logger'
import { importFigmaFile } from './import-from-figma'

import type { FigmaIconifyFile, ImportFigmaFileOptions } from './import-from-figma'

export type { FigmaIconifyFile, ImportFigmaFileOptions }

export interface ImportFigmaIconSetOptions extends ImportFigmaFileOptions {
  /**
   * Figma files
   */
  files: FigmaIconifyFile[]
}

/** Icon component in Figma will be imported */
export async function importFigmaIconSets(options: ImportFigmaIconSetOptions) {
  const {
    token,
  } = options

  if (typeof token !== 'string') {
    throw new TypeError('token type error')
  }
  if (!token) {
    throw new Error('token not found')
  }

  const { files: figmaFiles, ...fileOptions } = options

  const iconSetsResult = await Promise.all(
    figmaFiles.map(async (item) => {
      return await importFigmaFile(item, fileOptions)
    }),
  )

  const okIconSets: IconSet[] = []

  for (const [index, item] of iconSetsResult.entries()) {
    if (item === 'not_modified') {
      logger.log(`file id: ${figmaFiles[index].id} not modified.`)
      continue
    }
    okIconSets.push(item)
    logger.log(`file id: ${figmaFiles[index].id} import success.`)
  }

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
    logger.log(
      `Merged icon sets from ${okIconSets.length} to ${mergedIconSets.length}`,
    )
  }

  return mergedIconSets
}
