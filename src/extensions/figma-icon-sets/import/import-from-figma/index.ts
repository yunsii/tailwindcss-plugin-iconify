import { importFromFigma } from '@iconify/tools'

import type { IconSet } from '@iconify/tools'
import type { DocumentNotModified } from '@iconify/tools/lib/download/types/modified.js'
import type { FigmaImportOptions } from '@iconify/tools/lib/import/figma/types/options.js'

import {
  COLORED_POSTFIX,
  normalizeColoredName,
  optimizeIconSet,
} from '../../../../helpers/icon-set'
import { iconNameForNode } from './process-node'

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

export interface ImportFigmaFileOptions {
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

export async function importFigmaFile(
  file: FigmaIconifyFile,
  options: ImportFigmaFileOptions,
): Promise<IconSet | DocumentNotModified> {
  const { token, cache = false, cacheOptions = {}, preserveColorsGroup } = options
  const { id, pages, nodeIds, prefix } = file

  const result = await importFromFigma({
    prefix,
    file: id,
    ids: nodeIds,
    pages,
    token,
    cacheDir: cache ? `.figma-cache/${prefix}` : undefined,
    ...cacheOptions,
    iconNameForNode: (node: any) => iconNameForNode(node, { prefix, preserveColorsGroup }),
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
