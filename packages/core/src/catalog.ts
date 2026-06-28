export interface IconcatCatalog {
  version: 1
  icons: IconcatCatalogIcons
  entries?: Record<string, IconcatEntryCatalog>
  diagnostics?: IconcatDiagnostic[]
}

export type IconcatCatalogIcons = Record<string, string[]>

export interface IconcatEntryCatalog {
  icons: IconcatCatalogIcons
  modules?: string[]
  priority?: boolean
  scope?: IconcatEntryScope
}

export type IconcatEntryScope = 'global' | 'page'

export type IconcatDiagnosticSeverity = 'warning' | 'error'

export interface IconcatDiagnostic {
  severity: IconcatDiagnosticSeverity
  message: string
  file?: string
  line?: number
  column?: number
}

export function defineIconcatCatalog(catalog: IconcatCatalog): IconcatCatalog {
  return normalizeIconcatCatalog(catalog)
}

export function normalizeIconcatCatalog(
  catalog: IconcatCatalog,
): IconcatCatalog {
  return {
    ...catalog,
    version: 1,
    icons: normalizeCatalogIcons(catalog.icons),
    entries: catalog.entries
      ? Object.fromEntries(
          Object.entries(catalog.entries).map(([entryName, entry]) => [
            entryName,
            {
              ...entry,
              icons: normalizeCatalogIcons(entry.icons),
              modules: entry.modules ? [...new Set(entry.modules)].sort() : undefined,
              priority: entry.priority || undefined,
              scope: entry.scope === 'global' ? 'global' : undefined,
            },
          ]),
        )
      : undefined,
  }
}

export function normalizeCatalogIcons(
  icons: IconcatCatalogIcons,
): IconcatCatalogIcons {
  return Object.fromEntries(
    Object.entries(icons)
      .filter(([, names]) => names.length > 0)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([prefix, names]) => [prefix, [...new Set(names)].sort()]),
  )
}

export function mergeCatalogIcons(
  ...items: Array<IconcatCatalogIcons | undefined>
): IconcatCatalogIcons {
  const merged: Record<string, Set<string>> = Object.create(null)

  items.forEach((icons) => {
    Object.entries(icons || {}).forEach(([prefix, names]) => {
      const bucket = merged[prefix] || (merged[prefix] = new Set())
      names.forEach((name) => bucket.add(name))
    })
  })

  return normalizeCatalogIcons(
    Object.fromEntries(
      Object.entries(merged).map(([prefix, names]) => [
        prefix,
        Array.from(names),
      ]),
    ),
  )
}
