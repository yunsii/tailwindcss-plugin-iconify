import { mkdir, writeFile } from 'node:fs/promises'
import process from 'node:process'

import {
  defineIconcatCatalog,
  mergeCatalogIcons,
  normalizeCatalogIcons,
} from '@iconcat/core'
import fg from 'fast-glob'
import { dirname, resolve } from 'pathe'

import type { IconcatDiagnostic } from '@iconcat/core'

import { getContentHash } from './cache'
import { createEsbuildBundler } from './esbuild'
import { extractSourceIcons } from './source'

import type {
  EntryIconUsage,
  ExtractIconCatalogResult,
  IconcatBundleCacheInput,
  IconcatConfig,
  IconcatModule,
  IconcatModuleCacheInput,
  IconcatPreset,
  ModuleIconUsage,
  WriteIconCatalogResult,
} from './config'

export async function extractIconCatalog(
  config: IconcatConfig = {},
): Promise<ExtractIconCatalogResult> {
  const cwd = resolve(config.cwd || process.cwd())
  const presets = config.presets || []
  const entries = await resolveEntries(cwd, config.entries || [], presets)
  const bundler = config.bundler || createEsbuildBundler()
  const bundleInput: IconcatBundleCacheInput = {
    cwd,
    entries,
    exclude: [],
    bundler: bundler.cacheKey || bundler.name,
  }
  let bundle = await config.cache?.getBundle?.(bundleInput)

  if (!bundle) {
    bundle = await bundler.bundle({ cwd, entries, exclude: [] })
    await config.cache?.setBundle?.(bundleInput, bundle)
  }

  const moduleUsages = new Map<string, ModuleIconUsage>()
  const diagnostics: IconcatDiagnostic[] = []

  await Promise.all(bundle.modules.map(async (mod) => {
    const result = await extractModuleIcons(mod, config)
    moduleUsages.set(mod.file, {
      file: mod.file,
      icons: result.icons,
    })
    diagnostics.push(...result.diagnostics)
  }))

  const entryUsages: EntryIconUsage[] = bundle.entries.map((entry) => {
    const icons = mergeCatalogIcons(
      ...entry.modules.map((moduleFile) => moduleUsages.get(moduleFile)?.icons),
    )
    return {
      name: entry.name,
      file: entry.file,
      icons,
      modules: entry.modules,
    }
  })

  const icons = normalizeCatalogIcons(
    mergeCatalogIcons(...entryUsages.map((entry) => entry.icons)),
  )

  return {
    catalog: defineIconcatCatalog({
      version: 1,
      icons,
      entries: Object.fromEntries(
        entryUsages.map((entry) => [
          entry.name,
          {
            icons: entry.icons,
            modules: entry.modules,
          },
        ]),
      ),
      diagnostics,
    }),
    entries: entryUsages,
    modules: Array.from(moduleUsages.values()),
    graph: {
      entries: bundle.entries,
      modules: bundle.modules.map((mod) => mod.file).sort(),
    },
    diagnostics,
  }
}

async function extractModuleIcons(
  mod: IconcatModule,
  config: IconcatConfig,
) {
  const cacheInput = getModuleCacheInput(mod, config.extractors)
  const cached = await config.cache?.getModule?.(cacheInput)

  if (cached) {
    return cached
  }

  const result = extractSourceIcons(mod.code, config.extractors, mod.file)

  await config.cache?.setModule?.(cacheInput, result)

  return result
}

function getModuleCacheInput(
  mod: IconcatModule,
  extractors: IconcatConfig['extractors'],
): IconcatModuleCacheInput {
  return {
    file: mod.file,
    hash: getContentHash(mod.code),
    extractors,
  }
}

export async function writeIconCatalog(
  config: IconcatConfig = {},
): Promise<WriteIconCatalogResult> {
  const result = await extractIconCatalog(config)
  const cwd = resolve(config.cwd || process.cwd())
  const output = config.output || '.iconcat/catalog.json'
  const outputFile = resolve(cwd, output)

  await mkdir(dirname(outputFile), { recursive: true })
  await writeFile(outputFile, `${JSON.stringify(result.catalog, null, 2)}\n`)

  const writeResult = {
    ...result,
    cwd,
    output,
  }

  await Promise.all(
    (config.artifacts || []).map((artifact) => artifact.write(writeResult)),
  )

  return writeResult
}

async function resolveEntries(
  cwd: string,
  explicitEntries: string[],
  presets: IconcatPreset[],
) {
  const patterns = [
    ...explicitEntries,
    ...presets.flatMap((preset) => preset.entries),
  ]

  if (!patterns.length) {
    throw new Error('Iconcat requires at least one entry or preset.')
  }

  const entries = await fg(patterns, {
    cwd,
    absolute: false,
    onlyFiles: true,
    ignore: presets.flatMap((preset) => preset.exclude || []),
  })

  if (!entries.length) {
    throw new Error(`Iconcat could not resolve entries from: ${patterns.join(', ')}`)
  }

  return entries.sort()
}
