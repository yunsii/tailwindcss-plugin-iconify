import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import process from 'node:process'

import type { IconifyJSON } from '@iconify/types'

const packageRequire = createRequire(import.meta.url)

/**
 * Callback for loading icon set
 */
type IconifyJSONLoaderCallback = () => IconifyJSON

/**
 * Options for icon set loaders
 */
export interface IconifyPluginLoaderOptions {
  // Custom icon sets
  // Value can be loaded icon set or callback that loads icon set
  iconSets?: Record<string, IconifyJSON | string | IconifyJSONLoaderCallback>
  // Directory used to resolve installed @iconify-json/* packages.
  cwd?: string
}

/**
 * Locate icon set
 */
interface LocatedIconSet {
  main: string
  info?: string
}
function resolvePackagePath(id: string, cwd?: string): string | undefined {
  const resolver = cwd
    ? createRequire(resolve(cwd, 'package.json'))
    : packageRequire

  try {
    return resolver.resolve(id)
  } catch {}
}

export function locateIconSet(prefix: string, cwd = process.cwd()): LocatedIconSet | undefined {
  try {
    const main = resolvePackagePath(`@iconify-json/${prefix}/icons.json`, cwd)
      || resolvePackagePath(`@iconify-json/${prefix}/icons.json`)
    const info = resolvePackagePath(`@iconify-json/${prefix}/info.json`, cwd)
      || resolvePackagePath(`@iconify-json/${prefix}/info.json`)
    if (main) {
      return {
        main,
        info,
      }
    }
  } catch {}
  try {
    const iconSetPath = ['@iconify/json/json/', prefix, '.json'].join('')
    const main = resolvePackagePath(iconSetPath, cwd)
      || resolvePackagePath(iconSetPath)
    if (main) {
      return {
        main,
      }
    }
  } catch {}
}

/**
 * Cache for loaded icon sets
 *
 * Tailwind CSS can send multiple separate requests to plugin, this will
 * prevent same data from being loaded multiple times.
 *
 * Key is filename, not prefix!
 */
const cache = Object.create(null) as Record<string, IconifyJSON>

/**
 * Load icon set
 */
export function loadIconSet(
  prefix: string,
  options: IconifyPluginLoaderOptions,
): IconifyJSON | undefined {
  let filename: LocatedIconSet | undefined

  // Check for custom icon set
  const customIconSet = options.iconSets?.[prefix]
  if (customIconSet) {
    switch (typeof customIconSet) {
      case 'function': {
        // Callback. Store result in options to avoid loading it again
        const result = customIconSet()
        if (options.iconSets) {
          options.iconSets[prefix] = result
        }
        return result
      }

      case 'string': {
        // Filename to load it from
        filename = {
          main: customIconSet,
        }
        break
      }

      default:
        return customIconSet
    }
  } else {
    // Find icon set
    filename = locateIconSet(prefix, options.cwd)
  }

  if (!filename) {
    return
  }

  const main = typeof filename === 'string' ? filename : filename.main

  // Check for cache
  if (cache[main]) {
    return cache[main]
  }

  // Attempt to load it
  try {
    const result = JSON.parse(readFileSync(main, 'utf8'))
    if (!result.info && typeof filename === 'object' && filename.info) {
      // Load info from a separate file
      result.info = JSON.parse(readFileSync(filename.info, 'utf8'))
    }
    cache[main] = result
    return result
  } catch {}
}

export function ensureLoadIconSet(
  prefix: string,
  options: IconifyPluginLoaderOptions,
): IconifyJSON {
  const iconSet = loadIconSet(prefix, options)
  if (!iconSet) {
    throw new Error(
      `Cannot load icon set for "${prefix}". Install "@iconify-json/${prefix}" as dev dependency?`,
    )
  }
  return iconSet
}
