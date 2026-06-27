import type { IconcatDiagnostic } from '@iconcat/core'

export interface IconcatConfig {
  cwd?: string
  entries?: string[]
  output?: string
  presets?: IconcatPreset[]
  extractors?: IconcatExtractorOptions
  bundler?: IconcatBundler
  cache?: IconcatExtractionCache
  artifacts?: IconcatArtifact[]
}

export interface IconcatArtifact {
  name: string
  write: (result: WriteIconCatalogResult) => Promise<void> | void
}

export interface IconcatPreset {
  name: string
  entries: string[]
  exclude?: string[]
}

export interface IconcatExtractorOptions {
  classPrefixes?: string[]
  componentNames?: string[]
  functionNames?: string[]
}

export interface IconcatBundler {
  name: string
  cacheKey?: string
  bundle: (options: IconcatBundleOptions) => Promise<IconcatBundleResult>
}

export interface IconcatBundleOptions {
  cwd: string
  entries: string[]
  exclude: string[]
}

export interface IconcatBundleResult {
  entries: IconcatEntry[]
  modules: IconcatModule[]
}

export interface IconcatEntry {
  name: string
  file: string
  modules: string[]
}

export interface IconcatModule {
  file: string
  code: string
}

export interface IconcatBundleCacheInput {
  cwd: string
  entries: string[]
  exclude: string[]
  bundler: string
}

export interface IconcatModuleCacheInput {
  file: string
  hash: string
  extractors?: IconcatExtractorOptions
}

export interface IconcatModuleCacheValue {
  icons: import('@iconcat/core').IconcatCatalogIcons
  diagnostics: IconcatDiagnostic[]
}

export interface IconcatExtractionCache {
  getBundle?: (
    input: IconcatBundleCacheInput,
  ) => Promise<IconcatBundleResult | undefined> | IconcatBundleResult | undefined
  setBundle?: (
    input: IconcatBundleCacheInput,
    value: IconcatBundleResult,
  ) => Promise<void> | void
  getModule?: (
    input: IconcatModuleCacheInput,
  ) => Promise<IconcatModuleCacheValue | undefined> | IconcatModuleCacheValue | undefined
  setModule?: (
    input: IconcatModuleCacheInput,
    value: IconcatModuleCacheValue,
  ) => Promise<void> | void
}

export interface ExtractIconCatalogResult {
  catalog: import('@iconcat/core').IconcatCatalog
  entries: EntryIconUsage[]
  modules: ModuleIconUsage[]
  graph: IconcatGraph
  diagnostics: IconcatDiagnostic[]
}

export interface WriteIconCatalogResult extends ExtractIconCatalogResult {
  cwd: string
  output: string
}

export interface EntryIconUsage {
  name: string
  file: string
  icons: import('@iconcat/core').IconcatCatalogIcons
  modules: string[]
}

export interface ModuleIconUsage {
  file: string
  icons: import('@iconcat/core').IconcatCatalogIcons
}

export interface IconcatGraph {
  entries: IconcatEntry[]
  modules: string[]
}

export function defineIconcatConfig(config: IconcatConfig): IconcatConfig {
  return config
}
