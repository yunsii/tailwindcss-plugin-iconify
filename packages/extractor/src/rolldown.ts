import { readFile } from 'node:fs/promises'

import { relative, resolve } from 'pathe'
import { rolldown } from 'rolldown'

import type { OutputChunk } from 'rolldown'

import type {
  IconcatBundleOptions,
  IconcatBundler,
  IconcatBundleResult,
} from './config'

export interface RolldownIconcatBundlerOptions {
  includeDeps?: string[]
  excludeDeps?: boolean | string[]
  excludeExtensions?: string[]
}

export function createRolldownBundler(
  options: RolldownIconcatBundlerOptions = {},
): IconcatBundler {
  return {
    name: 'rolldown',
    async bundle(bundleOptions) {
      return bundleWithRolldown(bundleOptions, options)
    },
  }
}

async function bundleWithRolldown(
  bundleOptions: IconcatBundleOptions,
  options: RolldownIconcatBundlerOptions,
): Promise<IconcatBundleResult> {
  const entryPoints = bundleOptions.entries.map((entry) =>
    resolve(bundleOptions.cwd, entry),
  )

  const bundle = await rolldown({
    cwd: bundleOptions.cwd,
    input: entryPoints,
    platform: 'browser',
    treeshake: true,
    logLevel: 'silent',
    external: createExternal(options, bundleOptions.exclude),
  })

  try {
    const result = await bundle.generate({
      format: 'esm',
      dir: 'iconcat-out',
      sourcemap: false,
    })

    const chunks = result.output.filter((output): output is OutputChunk =>
      output.type === 'chunk',
    )
    const chunkByFileName = new Map(
      chunks.map((chunk) => [chunk.fileName, chunk]),
    )
    const modules = new Map<string, string>()
    const entryModules = new Map<string, Set<string>>()

    chunks.forEach((chunk) => {
      if (!chunk.isEntry || !chunk.facadeModuleId) {
        return
      }

      const entry = normalizeFile(chunk.facadeModuleId, bundleOptions.cwd)
      const bucket = entryModules.get(entry) || new Set<string>()
      entryModules.set(entry, bucket)

      collectChunkModuleIds(chunk, chunkByFileName).forEach((id) => {
        if (!shouldCollectModule(id)) {
          return
        }

        const file = normalizeFile(id, bundleOptions.cwd)
        bucket.add(file)
        modules.set(file, '')
      })
    })

    await Promise.all(
      Array.from(modules.keys()).map(async (file) => {
        modules.set(file, await readFile(resolve(bundleOptions.cwd, file), 'utf8'))
      }),
    )

    return {
      entries: Array.from(entryModules.entries()).map(([file, moduleFiles]) => ({
        name: file,
        file,
        modules: Array.from(moduleFiles).sort(),
      })),
      modules: Array.from(modules.entries()).map(([file, code]) => ({
        file,
        code,
      })),
    }
  } finally {
    await bundle.close()
  }
}

function collectChunkModuleIds(
  chunk: OutputChunk,
  chunkByFileName: Map<string, OutputChunk>,
  seen = new Set<string>(),
): string[] {
  if (seen.has(chunk.fileName)) {
    return []
  }
  seen.add(chunk.fileName)

  return [
    ...chunk.moduleIds,
    ...[...chunk.imports, ...chunk.dynamicImports].flatMap((fileName) => {
      const imported = chunkByFileName.get(fileName)
      return imported ? collectChunkModuleIds(imported, chunkByFileName, seen) : []
    }),
  ]
}

function createExternal(
  options: RolldownIconcatBundlerOptions,
  exclude: string[],
) {
  const includeDeps = options.includeDeps || []
  const excludeDeps = options.excludeDeps ?? true
  const patterns = buildExternalPatterns(options, exclude)

  return (id: string) => {
    if (patterns.some((pattern) => pattern.test(id))) {
      return true
    }
    if (!isBareImport(id) || !excludeDeps) {
      return false
    }
    if (includeDeps.some((dep) => id === dep || id.startsWith(`${dep}/`))) {
      return false
    }
    return true
  }
}

function buildExternalPatterns(
  options: RolldownIconcatBundlerOptions,
  exclude: string[],
) {
  const extensions = options.excludeExtensions || [
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.avif',
    '.svg',
    '.woff',
    '.woff2',
  ]

  return [
    ...exclude.map((pattern) => globToRegExp(pattern)),
    ...extensions.map((extension) => globToRegExp(`*${extension}`)),
  ]
}

function globToRegExp(pattern: string) {
  return new RegExp(
    `^${pattern
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`))
      .join('.*')}$`,
  )
}

function isBareImport(id: string) {
  return /^[^./]|^\.[^./]|^\.\.[^/]/.test(id)
}

function shouldCollectModule(id: string) {
  return !id.includes('\0') && isFileModuleId(id)
}

function isFileModuleId(id: string) {
  return id.startsWith('/')
    || id.startsWith('.')
    || /^[A-Z]:[\\/]/i.test(id)
}

function normalizeFile(file: string, cwd: string) {
  return file.startsWith('/')
    ? relative(cwd, file)
    : file
}
