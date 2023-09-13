import { type LoadFigmaIconSetOptions, loadFigmaIconSet } from './load'

/**
 * tailwind do not support async plugin for now
 *
 * ref: https://github.com/tailwindlabs/tailwindcss/discussions/7277
 */
export async function getFigmaIconSet(options: LoadFigmaIconSetOptions) {
  const iconSet = await loadFigmaIconSet(options)

  return {
    [options.prefix]: iconSet.export(),
  }
}
