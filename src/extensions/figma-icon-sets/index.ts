import type { IconifyJSON } from '@iconify/types'

import { type ImportFigmaIconSetOptions, importFigmaIconSets } from './import'

/**
 * tailwind do not support async plugin for now
 *
 * ref: https://github.com/tailwindlabs/tailwindcss/discussions/7277
 */
export async function getFigmaIconSets(options: ImportFigmaIconSetOptions) {
  const iconSets = await importFigmaIconSets(options)

  return iconSets.reduce((previous, current) => {
    return {
      ...previous,
      [current.prefix]: current.export(),
    }
  }, {}) as Record<string, IconifyJSON>
}
