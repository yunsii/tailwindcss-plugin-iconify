import { readFile } from 'node:fs/promises'

import { relative, resolve } from 'pathe'

import type {
  IconcatBundleResult,
  IconcatEntry,
} from './config'

export interface IconcatChunkGraphNode {
  fileName: string
  entryFile?: string | null
  imports?: string[]
  dynamicImports?: string[]
  moduleDeps?: Record<string, string[]>
  modules: string[]
}

export interface BuildIconcatBundleFromGraphOptions {
  cwd: string
  chunks: IconcatChunkGraphNode[]
  shouldCollectModule?: (id: string) => boolean
}

export async function buildIconcatBundleFromGraph(
  options: BuildIconcatBundleFromGraphOptions,
): Promise<IconcatBundleResult> {
  const graph = traverseIconcatChunkGraph(options)
  const modules = new Map<string, string>()

  graph.modules.forEach((file) => {
    modules.set(file, '')
  })

  await Promise.all(
    Array.from(modules.keys()).map(async (file) => {
      modules.set(file, await readFile(resolve(options.cwd, file), 'utf8'))
    }),
  )

  return {
    entries: graph.entries,
    modules: Array.from(modules.entries()).map(([file, code]) => ({
      file,
      code,
      deps: graph.moduleDeps[file] || [],
    })),
  }
}

export function traverseIconcatChunkGraph(
  options: BuildIconcatBundleFromGraphOptions,
): {
  entries: IconcatEntry[]
  moduleDeps: Record<string, string[]>
  modules: string[]
} {
  const chunkByFileName = new Map(
    options.chunks.map((chunk) => [chunk.fileName, chunk]),
  )
  const modules = new Set<string>()
  const moduleDeps = new Map<string, Set<string>>()
  const entries: IconcatEntry[] = []
  const shouldCollectModule = options.shouldCollectModule || isCollectableModuleId

  options.chunks.forEach((chunk) => {
    if (!chunk.entryFile) {
      return
    }

    const moduleFiles = new Set<string>()

    collectChunkModuleIds(chunk, chunkByFileName).forEach((id) => {
      if (!shouldCollectModule(id)) {
        return
      }

      const file = normalizeFile(id, options.cwd)
      moduleFiles.add(file)
      modules.add(file)
    })

    collectChunkModuleDeps(chunk, chunkByFileName).forEach(([id, deps]) => {
      if (!shouldCollectModule(id)) {
        return
      }

      const file = normalizeFile(id, options.cwd)
      const bucket = moduleDeps.get(file) || new Set<string>()
      moduleDeps.set(file, bucket)

      deps.forEach((dep) => {
        if (shouldCollectModule(dep)) {
          bucket.add(normalizeFile(dep, options.cwd))
        }
      })
    })

    const file = normalizeFile(chunk.entryFile, options.cwd)
    entries.push({
      name: file,
      file,
      modules: Array.from(moduleFiles).sort(),
    })
  })

  return {
    entries: entries.sort((a, b) => a.file.localeCompare(b.file)),
    moduleDeps: Object.fromEntries(
      Array.from(moduleDeps.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([file, deps]) => [file, Array.from(deps).sort()]),
    ),
    modules: Array.from(modules).sort(),
  }
}

export function isCollectableModuleId(id: string) {
  return !id.includes('\0') && isFileModuleId(id)
}

export function normalizeFile(file: string, cwd: string) {
  return file.startsWith('/')
    ? relative(cwd, file)
    : file
}

function collectChunkModuleIds(
  chunk: IconcatChunkGraphNode,
  chunkByFileName: Map<string, IconcatChunkGraphNode>,
  seen = new Set<string>(),
): string[] {
  if (seen.has(chunk.fileName)) {
    return []
  }
  seen.add(chunk.fileName)

  return [
    ...chunk.modules,
    ...[...(chunk.imports || []), ...(chunk.dynamicImports || [])].flatMap((fileName) => {
      const imported = chunkByFileName.get(fileName)
      return imported ? collectChunkModuleIds(imported, chunkByFileName, seen) : []
    }),
  ]
}

function collectChunkModuleDeps(
  chunk: IconcatChunkGraphNode,
  chunkByFileName: Map<string, IconcatChunkGraphNode>,
  seen = new Set<string>(),
): Array<[string, string[]]> {
  if (seen.has(chunk.fileName)) {
    return []
  }
  seen.add(chunk.fileName)

  return [
    ...Object.entries(chunk.moduleDeps || {}),
    ...[...(chunk.imports || []), ...(chunk.dynamicImports || [])].flatMap((fileName) => {
      const imported = chunkByFileName.get(fileName)
      return imported ? collectChunkModuleDeps(imported, chunkByFileName, seen) : []
    }),
  ]
}

function isFileModuleId(id: string) {
  return id.startsWith('/')
    || id.startsWith('.')
    || id.startsWith('..')
    || !isBareImport(id)
    || /^[A-Z]:[\\/]/i.test(id)
}

function isBareImport(id: string) {
  return /^[^./]|^\.[^./]|^\.\.[^/]/.test(id)
    && !/[/\\]/.test(id)
}
