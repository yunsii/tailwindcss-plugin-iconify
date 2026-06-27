import type { IconcatDiagnostic } from '@iconcat/core'

export interface IconcatConfig {
  cwd?: string
  entries?: string[]
  output?: string
  presets?: IconcatPreset[]
  extractors?: IconcatExtractorOptions
  bundler?: IconcatBundler
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
