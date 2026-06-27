import { resolve } from 'pathe'
import { rolldown } from 'rolldown'

import type { OutputChunk } from 'rolldown'

import { buildIconcatBundleFromGraph } from './graph'

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
    cacheKey: getRolldownBundlerCacheKey(options),
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

    return buildIconcatBundleFromGraph({
      cwd: bundleOptions.cwd,
      chunks: chunks.map((chunk) => ({
        fileName: chunk.fileName,
        entryFile: chunk.isEntry ? chunk.facadeModuleId : undefined,
        imports: chunk.imports,
        dynamicImports: chunk.dynamicImports,
        modules: chunk.moduleIds,
      })),
    })
  } finally {
    await bundle.close()
  }
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

function getRolldownBundlerCacheKey(options: RolldownIconcatBundlerOptions) {
  return JSON.stringify({
    name: 'rolldown',
    includeDeps: options.includeDeps || [],
    excludeDeps: options.excludeDeps ?? true,
    excludeExtensions: options.excludeExtensions || [],
  })
}
