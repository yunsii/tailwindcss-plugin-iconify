import type { IconcatCatalog, IconcatCatalogIcons } from '@iconcat/core'
import type { IconCSSIconSetOptions } from '@iconify/utils/lib/css/types'

import type { IconifyPluginLoaderOptions } from './loader'

/**
 * Common options
 */
export interface IconcatTailwindCommonOptions
  extends IconifyPluginLoaderOptions {}

/**
 * Options for static class names
 */
export interface StaticIconsOptions
  extends IconcatTailwindCommonOptions,
  IconCSSIconSetOptions {}

/**
 * Options for runtime icon class names
 */
export interface DynamicIconsOptions
  extends IconcatTailwindCommonOptions {
  /** Class prefix */
  prefix?: string

  /** Include icon-specific selectors only */
  overrideOnly?: true
}

/**
 * Options for the main Tailwind icons plugin.
 */
export interface IconsOptions extends DynamicIconsOptions {
  /** Export static icon class names such as `icon-mdi--home`. */
  static?: string[] | Record<string, string[] | '*'>
}

export interface CatalogIconsOptions extends DynamicIconsOptions {}

export type IconCatalogInput =
  | IconcatCatalog
  | IconcatCatalogIcons
