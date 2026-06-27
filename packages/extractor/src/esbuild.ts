import { readFile } from 'node:fs/promises'

import { build } from 'esbuild'
import { relative, resolve } from 'pathe'

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
  const modules = new Map<string, string>()
  const entryModules = new Map<string, Set<string>>()
  const outputs = metafile.outputs

  Object.entries(outputs).forEach(([outputFile, output]) => {
    if (!output.entryPoint) {
      return
    }

    const entry = normalizeFile(output.entryPoint, bundleOptions.cwd)
    const bucket = entryModules.get(entry) || new Set<string>()
    entryModules.set(entry, bucket)

    collectOutputInputs(outputFile, outputs).forEach((input) => {
      const file = normalizeFile(input, bundleOptions.cwd)
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

function collectOutputInputs(
  outputFile: string,
  outputs: NonNullable<Awaited<ReturnType<typeof build>>['metafile']>['outputs'],
  seen = new Set<string>(),
): string[] {
  if (seen.has(outputFile)) {
    return []
  }
  seen.add(outputFile)

  const output = outputs[outputFile]
  if (!output) {
    return []
  }

  return [
    ...Object.keys(output.inputs),
    ...output.imports.flatMap((item) =>
      collectOutputInputs(item.path, outputs, seen),
    ),
  ]
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

function normalizeFile(file: string, cwd: string) {
  return file.startsWith('/')
    ? relative(cwd, file)
    : file
}
