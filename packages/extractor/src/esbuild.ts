import { build } from 'esbuild'
import { resolve } from 'pathe'

import { buildIconcatBundleFromGraph } from './graph'

import type {
  IconcatBundleOptions,
  IconcatBundler,
  IconcatBundleResult,
} from './config'

export interface EsbuildIconcatBundlerOptions {
  includeDeps?: string[]
  excludeDeps?: boolean | string[]
  excludeExtensions?: string[]
}

export function createEsbuildBundler(
  options: EsbuildIconcatBundlerOptions = {},
): IconcatBundler {
  return {
    name: 'esbuild',
    cacheKey: getEsbuildBundlerCacheKey(options),
    async bundle(bundleOptions) {
      return bundleWithEsbuild(bundleOptions, options)
    },
  }
}

async function bundleWithEsbuild(
  bundleOptions: IconcatBundleOptions,
  options: EsbuildIconcatBundlerOptions,
): Promise<IconcatBundleResult> {
  const entryPoints = bundleOptions.entries.map((entry) =>
    resolve(bundleOptions.cwd, entry),
  )

  const result = await build({
    absWorkingDir: bundleOptions.cwd,
    entryPoints,
    bundle: true,
    write: false,
    metafile: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    treeShaking: true,
    logLevel: 'silent',
    outdir: 'iconcat-out',
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
      '.ts': 'tsx',
      '.tsx': 'tsx',
      '.mdx': 'tsx',
    },
    external: buildExternalPatterns(options, bundleOptions.exclude),
    plugins: [
      externalizeDependenciesPlugin(options),
    ],
  })

  const metafile = result.metafile!
  const outputs = metafile.outputs

  return buildIconcatBundleFromGraph({
    cwd: bundleOptions.cwd,
    chunks: Object.entries(outputs).map(([outputFile, output]) => ({
      fileName: outputFile,
      entryFile: output.entryPoint,
      imports: output.imports.map((item) => item.path),
      modules: Object.keys(output.inputs),
    })),
  })
}

function externalizeDependenciesPlugin(options: EsbuildIconcatBundlerOptions) {
  const includeDeps = options.includeDeps || []
  const excludeDeps = options.excludeDeps ?? true

  return {
    name: 'iconcat-externalize-dependencies',
    setup(buildApi: Parameters<NonNullable<Parameters<typeof build>[0]['plugins']>[number]['setup']>[0]) {
      buildApi.onResolve({ filter: /^[^./]|^\.[^./]|^\.\.[^/]/ }, (args) => {
        if (!excludeDeps) {
          return
        }
        if (includeDeps.some((dep) => args.path === dep || args.path.startsWith(`${dep}/`))) {
          return
        }
        return {
          path: args.path,
          external: true,
        }
      })
    },
  }
}

function buildExternalPatterns(
  options: EsbuildIconcatBundlerOptions,
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
    ...exclude,
    ...extensions.map((extension) => `*${extension}`),
  ]
}

function getEsbuildBundlerCacheKey(options: EsbuildIconcatBundlerOptions) {
  return JSON.stringify({
    name: 'esbuild',
    includeDeps: options.includeDeps || [],
    excludeDeps: options.excludeDeps ?? true,
    excludeExtensions: options.excludeExtensions || [],
  })
}
