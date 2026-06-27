export {
  defineIconcatCatalog,
  mergeCatalogIcons,
  normalizeCatalogIcons,
  normalizeIconcatCatalog,
} from './catalog'
export type {
  IconcatCatalog,
  IconcatCatalogIcons,
  IconcatDiagnostic,
  IconcatDiagnosticSeverity,
  IconcatEntryCatalog,
} from './catalog'

export {
  getIconNames,
  iconNameMapToCatalogIcons,
  parseDynamicIconValue,
  parseIconName,
} from './names'
export type { IconcatIconName, IconcatIconNameMap } from './names'
