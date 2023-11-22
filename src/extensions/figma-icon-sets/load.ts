import consola from 'consola'

import { type WriteIconifyJSONsOptions, writeIconifyJSONs } from './write'
import { type ImportFigmaIconSetOptions, importFigmaIconSets } from './import'

export interface LoadFigmaIconSetOptions {
  import: ImportFigmaIconSetOptions
  write: WriteIconifyJSONsOptions
}

/** Icon component in Figma will be loaded */
export async function loadFigmaIconSets(options: LoadFigmaIconSetOptions) {
  const { import: importOptions, write: writeOptions } = options

  const iconSets = await importFigmaIconSets(importOptions)
  iconSets.forEach((iconSet) => {
    consola.log('Found', iconSet.prefix, iconSet.count(), 'icons')
  })

  writeIconifyJSONs(iconSets, writeOptions)
}
