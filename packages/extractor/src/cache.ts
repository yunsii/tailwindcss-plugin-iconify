import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

import { resolve } from 'pathe'

import type {
  IconcatBundleCacheInput,
  IconcatBundleResult,
  IconcatExtractionCache,
  IconcatModuleCacheInput,
  IconcatModuleCacheValue,
} from './config'

export interface MemoryIconcatExtractionCache
  extends IconcatExtractionCache {
  clear: () => void
  size: () => number
  stats: () => MemoryIconcatExtractionCacheStats
}

export interface MemoryIconcatExtractionCacheStats {
  bundleCodeBytes: number
  bundles: number
  moduleIconBytes: number
  modules: number
}

interface BundleCacheRecord {
  bundle: IconcatBundleResult
  hashes: Map<string, string>
}

export function createMemoryIconcatExtractionCache(): MemoryIconcatExtractionCache {
  const bundles = new Map<string, BundleCacheRecord>()
  const modules = new Map<string, IconcatModuleCacheValue>()

  return {
    async getBundle(input) {
      const record = bundles.get(getBundleCacheKey(input))

      if (!record) {
        return undefined
      }

      const hashes = await getBundleModuleHashes(input.cwd, record.bundle)

      if (!hashes) {
        return undefined
      }

      return areHashesEqual(record.hashes, hashes) ? record.bundle : undefined
    },
    async setBundle(input, value) {
      bundles.set(getBundleCacheKey(input), {
        bundle: value,
        hashes: getBundleCodeHashes(value),
      })
    },
    getModule(input) {
      return modules.get(getModuleCacheKey(input))
    },
    setModule(input, value) {
      modules.set(getModuleCacheKey(input), value)
    },
    clear() {
      bundles.clear()
      modules.clear()
    },
    size() {
      return modules.size
    },
    stats() {
      return {
        bundles: bundles.size,
        modules: modules.size,
        bundleCodeBytes: getBundleCodeBytes(bundles),
        moduleIconBytes: getModuleIconBytes(modules),
      }
    },
  }
}

export function getBundleCacheKey(input: IconcatBundleCacheInput) {
  return JSON.stringify({
    cwd: input.cwd,
    entries: input.entries,
    exclude: input.exclude,
    bundler: input.bundler,
  })
}

export function getModuleCacheKey(input: IconcatModuleCacheInput) {
  return JSON.stringify({
    file: input.file,
    hash: input.hash,
    extractors: input.extractors || {},
  })
}

export function getContentHash(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

async function getBundleModuleHashes(
  cwd: string,
  bundle: IconcatBundleResult,
) {
  const hashes = new Map<string, string>()

  await Promise.all(bundle.modules.map(async (mod) => {
    const hash = await getFileHash(cwd, mod.file)

    if (hash) {
      hashes.set(mod.file, hash)
    }
  }))

  if (hashes.size !== bundle.modules.length) {
    return undefined
  }

  return hashes
}

function getBundleCodeHashes(bundle: IconcatBundleResult) {
  return new Map(
    bundle.modules.map((mod) => [mod.file, getContentHash(mod.code)]),
  )
}

async function getFileHash(cwd: string, file: string) {
  try {
    return getContentHash(await readFile(resolve(cwd, file), 'utf8'))
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return undefined
    }

    throw error
  }
}

function isFileNotFoundError(error: unknown) {
  return error instanceof Error
    && 'code' in error
    && error.code === 'ENOENT'
}

function areHashesEqual(left: Map<string, string>, right: Map<string, string>) {
  if (left.size !== right.size) {
    return false
  }

  for (const [file, hash] of left) {
    if (right.get(file) !== hash) {
      return false
    }
  }

  return true
}

function getBundleCodeBytes(bundles: Map<string, BundleCacheRecord>) {
  let total = 0

  bundles.forEach((record) => {
    record.bundle.modules.forEach((mod) => {
      total += Buffer.byteLength(mod.code)
    })
  })

  return total
}

function getModuleIconBytes(modules: Map<string, IconcatModuleCacheValue>) {
  let total = 0

  modules.forEach((value) => {
    total += Buffer.byteLength(JSON.stringify(value))
  })

  return total
}
