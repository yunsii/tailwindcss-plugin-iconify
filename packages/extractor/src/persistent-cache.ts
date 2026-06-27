import { Buffer } from 'node:buffer'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import process from 'node:process'

import { dirname, resolve } from 'pathe'

import {
  getBundleCacheKey,
  getContentHash,
  getModuleCacheKey,
} from './cache'

import type {
  IconcatBundleResult,
  IconcatExtractionCache,
  IconcatModuleCacheValue,
} from './config'

export interface PersistentIconcatExtractionCacheOptions {
  cwd?: string
  file?: string
}

export interface PersistentIconcatExtractionCache
  extends IconcatExtractionCache {
  stats: () => PersistentIconcatExtractionCacheStats
}

export interface PersistentIconcatExtractionCacheStats {
  bundleCodeBytes: number
  bundleHits: number
  bundleMisses: number
  fileHashHits: number
  fileHashMisses: number
  moduleHits: number
  moduleIconBytes: number
  modules: number
}

interface PersistentCacheFile {
  version: 1
  bundles: Record<string, PersistentBundleRecord>
  modules: Record<string, IconcatModuleCacheValue>
}

interface PersistentBundleRecord {
  bundle: IconcatBundleResult
  files: Record<string, PersistentFileFingerprint>
  merkle: Record<string, PersistentMerkleNode>
  sourceSignatures: Record<string, string>
}

interface PersistentFileFingerprint {
  hash: string
  mtimeMs: number
  size: number
}

interface PersistentMerkleNode {
  deps: string[]
  selfHash: string
  subtreeHash: string
}

const DEFAULT_CACHE_FILE = '.iconcat/cache/extractor-v1.json'

export async function createPersistentIconcatExtractionCache(
  options: PersistentIconcatExtractionCacheOptions = {},
): Promise<PersistentIconcatExtractionCache> {
  const cwd = resolve(options.cwd || process.cwd())
  const file = resolve(cwd, options.file || DEFAULT_CACHE_FILE)
  const store = await readStore(file)
  const fileHashCache = new Map<string, string>()
  const dirty = {
    value: false,
  }
  const stats: PersistentIconcatExtractionCacheStats = {
    bundleCodeBytes: 0,
    bundleHits: 0,
    bundleMisses: 0,
    fileHashHits: 0,
    fileHashMisses: 0,
    moduleHits: 0,
    moduleIconBytes: 0,
    modules: Object.keys(store.modules).length,
  }

  return {
    async getBundle(input) {
      const key = getBundleCacheKey(input)
      const record = store.bundles[key]

      if (!record) {
        stats.bundleMisses += 1
        return undefined
      }

      const currentFiles = await getCurrentFingerprints(input.cwd, record.files, fileHashCache, stats)

      if (!currentFiles) {
        stats.bundleMisses += 1
        return undefined
      }

      if (!areFingerprintsEqual(record.files, currentFiles)) {
        const changedFiles = getChangedFiles(record.files, currentFiles)
        const changedCode = await readChangedModuleCode(input.cwd, changedFiles)

        if (!areSourceSignaturesEqual(record.sourceSignatures, changedCode)) {
          stats.bundleMisses += 1
          return undefined
        }

        record.bundle = updateBundleChangedModules(record.bundle, changedCode)
        record.files = currentFiles
        record.merkle = createMerkleGraph(record.bundle, currentFiles)
        record.sourceSignatures = {
          ...record.sourceSignatures,
          ...Object.fromEntries(
            Object.entries(changedCode).map(([file, code]) => [
              file,
              getSourceImportSignature(code),
            ]),
          ),
        }
        dirty.value = true
      }

      stats.bundleHits += 1
      return record.bundle
    },
    async setBundle(input, value) {
      const files = await getBundleFingerprints(input.cwd, value, fileHashCache, stats)
      const merkle = createMerkleGraph(value, files)

      store.bundles[getBundleCacheKey(input)] = {
        bundle: value,
        files,
        merkle,
        sourceSignatures: getBundleSourceSignatures(value),
      }
      dirty.value = true
    },
    getModule(input) {
      const value = store.modules[getModuleCacheKey(input)]

      if (value) {
        stats.moduleHits += 1
      }

      return value
    },
    setModule(input, value) {
      store.modules[getModuleCacheKey(input)] = value
      dirty.value = true
    },
    async flush() {
      if (!dirty.value) {
        return
      }

      await atomicWriteJSON(file, store)
      dirty.value = false
    },
    stats() {
      return {
        ...stats,
        modules: Object.keys(store.modules).length,
        bundleCodeBytes: getBundleCodeBytes(store.bundles),
        moduleIconBytes: getModuleIconBytes(store.modules),
      }
    },
  }
}

async function readStore(file: string): Promise<PersistentCacheFile> {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8')) as PersistentCacheFile

    if (parsed.version === 1 && parsed.bundles && parsed.modules) {
      return parsed
    }
  } catch (error) {
    if (!isFileNotFoundError(error)) {
      throw error
    }
  }

  return {
    version: 1,
    bundles: {},
    modules: {},
  }
}

async function getCurrentFingerprints(
  cwd: string,
  files: Record<string, PersistentFileFingerprint>,
  fileHashCache: Map<string, string>,
  stats: PersistentIconcatExtractionCacheStats,
) {
  const current: Record<string, PersistentFileFingerprint> = {}

  for (const file of Object.keys(files).sort()) {
    const fingerprint = await getFileFingerprint(cwd, file, files[file], fileHashCache, stats)

    if (!fingerprint) {
      return undefined
    }

    current[file] = fingerprint
  }

  return current
}

async function getBundleFingerprints(
  cwd: string,
  bundle: IconcatBundleResult,
  fileHashCache: Map<string, string>,
  stats: PersistentIconcatExtractionCacheStats,
) {
  const files: Record<string, PersistentFileFingerprint> = {}

  await Promise.all(bundle.modules.map(async (mod) => {
    const info = await stat(resolve(cwd, mod.file))
    const hash = getContentHash(mod.code)

    fileHashCache.set(mod.file, hash)
    files[mod.file] = {
      hash,
      mtimeMs: info.mtimeMs,
      size: info.size,
    }
    stats.fileHashMisses += 1
  }))

  return files
}

async function getFileFingerprint(
  cwd: string,
  file: string,
  previous: PersistentFileFingerprint,
  fileHashCache: Map<string, string>,
  stats: PersistentIconcatExtractionCacheStats,
) {
  try {
    const info = await stat(resolve(cwd, file))

    if (info.size === previous.size && info.mtimeMs === previous.mtimeMs) {
      stats.fileHashHits += 1
      return previous
    }

    const cachedHash = fileHashCache.get(file)
    const hash = cachedHash || getContentHash(await readFile(resolve(cwd, file), 'utf8'))

    fileHashCache.set(file, hash)
    stats.fileHashMisses += 1

    return {
      hash,
      mtimeMs: info.mtimeMs,
      size: info.size,
    }
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return undefined
    }

    throw error
  }
}

function createMerkleGraph(
  bundle: IconcatBundleResult,
  files: Record<string, PersistentFileFingerprint>,
) {
  const depsByFile = new Map(
    bundle.modules.map((mod) => [
      mod.file,
      (mod.deps || []).filter((dep) => files[dep]),
    ]),
  )
  const merkle: Record<string, PersistentMerkleNode> = {}

  bundle.modules
    .map((mod) => mod.file)
    .sort()
    .forEach((file) => {
      computeSubtreeHash(file, depsByFile, files, merkle, new Set())
    })

  return merkle
}

function computeSubtreeHash(
  file: string,
  depsByFile: Map<string, string[]>,
  files: Record<string, PersistentFileFingerprint>,
  merkle: Record<string, PersistentMerkleNode>,
  stack: Set<string>,
) {
  const existing = merkle[file]

  if (existing) {
    return existing.subtreeHash
  }

  if (stack.has(file)) {
    return files[file]?.hash || ''
  }

  stack.add(file)

  const deps = (depsByFile.get(file) || []).slice().sort()
  const childHashes = deps.map((dep) =>
    computeSubtreeHash(dep, depsByFile, files, merkle, stack),
  )
  const selfHash = files[file]?.hash || ''
  const subtreeHash = getContentHash(JSON.stringify([selfHash, childHashes]))

  stack.delete(file)
  merkle[file] = {
    deps,
    selfHash,
    subtreeHash,
  }

  return subtreeHash
}

function areFingerprintsEqual(
  left: Record<string, PersistentFileFingerprint>,
  right: Record<string, PersistentFileFingerprint>,
) {
  const leftFiles = Object.keys(left).sort()
  const rightFiles = Object.keys(right).sort()

  if (leftFiles.length !== rightFiles.length) {
    return false
  }

  return leftFiles.every((file, index) =>
    file === rightFiles[index] && left[file].hash === right[file].hash)
}

function updateBundleChangedModules(
  bundle: IconcatBundleResult,
  changedCode: Record<string, string>,
) {
  return {
    entries: bundle.entries,
    modules: bundle.modules.map((mod) => ({
      ...mod,
      code: changedCode[mod.file] || mod.code,
    })),
  }
}

function getChangedFiles(
  previous: Record<string, PersistentFileFingerprint>,
  current: Record<string, PersistentFileFingerprint>,
) {
  return Object.keys(current)
    .filter((file) => previous[file]?.hash !== current[file].hash)
    .sort()
}

async function readChangedModuleCode(cwd: string, files: string[]) {
  const entries = await Promise.all(
    files.map(async (file) => [
      file,
      await readFile(resolve(cwd, file), 'utf8'),
    ] as const),
  )

  return Object.fromEntries(entries)
}

function getBundleSourceSignatures(bundle: IconcatBundleResult) {
  return Object.fromEntries(
    bundle.modules.map((mod) => [
      mod.file,
      getSourceImportSignature(mod.code),
    ]),
  )
}

function areSourceSignaturesEqual(
  previous: Record<string, string>,
  changedCode: Record<string, string>,
) {
  return Object.entries(changedCode).every(([file, code]) =>
    previous[file] === getSourceImportSignature(code))
}

function getSourceImportSignature(code: string) {
  const imports: string[] = []
  const sideEffectImport = /\bimport\s*['"]([^'"]+)['"]/g
  const dynamicImport = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  const requireCall = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g

  collectStaticFromImports(imports, code)
  collectImportMatches(imports, code, sideEffectImport)
  collectImportMatches(imports, code, dynamicImport)
  collectImportMatches(imports, code, requireCall)

  return getContentHash(JSON.stringify(imports.sort()))
}

function collectStaticFromImports(imports: string[], code: string) {
  code.split('\n')
    .filter((line) => /\b(?:import|export)\b/.test(line) && /\bfrom\b/.test(line))
    .forEach((line) => {
      const match = line.match(/\bfrom\s*['"]([^'"]+)['"]/)

      if (match) {
        imports.push(match[1])
      }
    })
}

function collectImportMatches(
  imports: string[],
  code: string,
  pattern: RegExp,
) {
  for (const match of code.matchAll(pattern)) {
    imports.push(match[1])
  }
}

async function atomicWriteJSON(file: string, value: unknown) {
  await mkdir(dirname(file), { recursive: true })
  const tempFile = `${file}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tempFile, `${JSON.stringify(value, null, 2)}\n`)
  await rename(tempFile, file)
}

function getBundleCodeBytes(bundles: Record<string, PersistentBundleRecord>) {
  let total = 0

  Object.values(bundles).forEach((record) => {
    record.bundle.modules.forEach((mod) => {
      total += Buffer.byteLength(mod.code)
    })
  })

  return total
}

function getModuleIconBytes(modules: Record<string, IconcatModuleCacheValue>) {
  let total = 0

  Object.values(modules).forEach((value) => {
    total += Buffer.byteLength(JSON.stringify(value))
  })

  return total
}

function isFileNotFoundError(error: unknown) {
  return error instanceof Error
    && 'code' in error
    && error.code === 'ENOENT'
}
