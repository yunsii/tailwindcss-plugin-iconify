import { logger } from './helpers/logger'
import { type ImportFigmaIconSetOptions, importFigmaIconSets } from './import'
import { writeIconifyJSONs, type WriteIconifyJSONsOptions } from './write'

export interface LoadFigmaIconSetOptions {
  import: ImportFigmaIconSetOptions
  write: WriteIconifyJSONsOptions
}

/** Icon component in Figma will be loaded */
export async function loadFigmaIconSets(options: LoadFigmaIconSetOptions) {
  const { import: importOptions, write: writeOptions } = options

  const iconSets = await importFigmaIconSets(importOptions)
  iconSets.forEach((iconSet) => {
    logger.log('Found', iconSet.prefix, iconSet.count(), 'icons')
  })

  writeIconifyJSONs(iconSets, writeOptions)
}
