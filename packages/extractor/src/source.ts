import {
  getIconNames,
  iconNameMapToCatalogIcons,
  mergeCatalogIcons,
  parseDynamicIconValue,
  parseIconName,
} from '@iconcat/core'

import type { IconcatCatalogIcons, IconcatDiagnostic } from '@iconcat/core'

import type { IconcatExtractorOptions } from './config'

export interface ExtractSourceIconsResult {
  icons: IconcatCatalogIcons
  diagnostics: IconcatDiagnostic[]
}

export function extractSourceIcons(
  code: string,
  options: IconcatExtractorOptions = {},
  file?: string,
): ExtractSourceIconsResult {
  const iconMaps = [
    extractClassIcons(code, options),
    extractStringLiteralIcons(code),
    extractDefinedIconcatIcons(code),
  ]
  const diagnostics: IconcatDiagnostic[] = []

  detectDynamicIconExpressions(code).forEach((message) => {
    diagnostics.push({
      severity: 'warning',
      message,
      file,
    })
  })

  return {
    icons: mergeCatalogIcons(...iconMaps),
    diagnostics,
  }
}

function extractClassIcons(
  code: string,
  options: IconcatExtractorOptions,
): IconcatCatalogIcons {
  const prefixes = options.classPrefixes || ['icon']
  const matches = code.matchAll(/(?:^|[\s"'`])([\w-]+-\[[^\]]+\]|icon--[\w-]+--[\w-]+)/g)
  const found: string[] = []

  for (const match of matches) {
    const value = match[1]
    const prefix = value.includes('-[') ? value.split('-[')[0] : 'icon'
    if (prefixes.includes(prefix)) {
      found.push(value)
    }
  }

  return iconNameMapToCatalogIconsFrom(found)
}

function extractStringLiteralIcons(code: string): IconcatCatalogIcons {
  const matches = code.matchAll(/["'`]([^"'`\s]+)["'`]/g)
  const found: string[] = []

  for (const match of matches) {
    const parsed = parseIconName(match[1]) || parseDynamicIconValue(match[1])
    if (parsed && !isKnownNonIconPrefix(parsed.prefix)) {
      found.push(`${parsed.prefix}:${parsed.name}`)
    }
  }

  return iconNameMapToCatalogIconsFrom(found)
}

function extractDefinedIconcatIcons(code: string): IconcatCatalogIcons {
  const matches = code.matchAll(/\bdefineIconcatIcons\s*\(\s*\[([\s\S]*?)\]\s*\)/g)
  const found: string[] = []

  for (const match of matches) {
    const values = match[1].matchAll(/["'`]([^"'`\s]+)["'`]/g)
    for (const value of values) {
      found.push(value[1])
    }
  }

  return iconNameMapToCatalogIconsFrom(found)
}

function isKnownNonIconPrefix(prefix: string) {
  return [
    'data',
    'file',
    'http',
    'https',
    'node',
  ].includes(prefix)
}

function iconNameMapToCatalogIconsFrom(values: string[]) {
  return iconNameMapToCatalogIcons(getIconNames(values))
}

function detectDynamicIconExpressions(code: string) {
  const warnings: string[] = []
  if (/\bicon\s*\(\s*`/.test(code) || /\bname\s*=\s*\{`/.test(code)) {
    warnings.push('Dynamic icon expressions are not extractable.')
  }
  return warnings
}
