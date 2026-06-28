import { createHash } from 'node:crypto'
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, resolve } from 'node:path'
import process from 'node:process'

import {
  getNextAppRouterRouteEntriesFromCandidates,
  isNextAppRouterPageEntry,
} from '@iconcat/adapter-utils/next-app-router'
import {
  mergeCatalogIcons,
  normalizeCatalogIcons,
  normalizeIconcatCatalog,
} from '@iconcat/core'
import { getIconsCSS } from '@iconify/utils/lib/css/icons'

import type {
  IconcatCatalog,
} from '@iconcat/core'

import { ensureLoadIconSet } from './loader'

import type { IconCatalogInput, StaticIconsOptions } from './options'

export interface IconcatCSSArtifactOptions extends StaticIconsOptions {
  artifactMode?: 'catalog' | 'global' | 'page'
  autoGlobalCommonNextAppLayouts?: boolean
  autoGlobalNextPagesApp?: boolean
  output?: string
  manifest?: string
  publicPath?: string
  clean?: boolean
}

export interface IconcatCSSArtifact {
  name: string
  write: (result: IconcatCSSArtifactInput) => Promise<void> | void
}

export interface IconcatCSSArtifactInput {
  catalog: IconcatCatalog
  cwd?: string
}

export function generateIconcatCSS(
  catalog: IconCatalogInput,
  options: StaticIconsOptions = {},
) {
  const icons = normalizeCatalogInput(catalog)

  return Object.entries(icons)
    .map(([prefix, names]) => {
      const iconSet = ensureLoadIconSet(prefix, options)

      return getIconsCSS(iconSet, names, {
        ...options,
        iconSelector: '.icon-\\[{prefix}--{name}\\]',
      }).trim()
    })
    .filter(Boolean)
    .join('\n\n')
}

export function createIconcatCSSArtifact(
  options: IconcatCSSArtifactOptions = {},
): IconcatCSSArtifact {
  const output = options.output || '.iconcat/iconcat.[hash].css'
  const manifest = options.manifest || '.iconcat/manifest.json'
  const publicPath = options.publicPath || '/assets'

  return {
    name: 'tailwind-iconcat-css',
    async write(result: IconcatCSSArtifactInput) {
      if (options.artifactMode === 'page') {
        await writePageCSSArtifact(result, options)
        return
      }

      if (options.artifactMode === 'global') {
        await writeGlobalCSSArtifact(result, options)
        return
      }

      const css = generateIconcatCSS(result.catalog, options)
      const cwd = result.cwd || process.cwd()
      const hash = createHash('sha256')
        .update(css)
        .digest('hex')
        .slice(0, 10)
      const outputFile = resolve(
        cwd,
        output.replace('[hash]', hash),
      )
      const manifestFile = resolve(cwd, manifest)
      const href = joinUrl(publicPath, basename(outputFile))

      await atomicWriteFile(outputFile, `${css}\n`)
      await mkdir(dirname(manifestFile), { recursive: true })
      await atomicWriteFile(
        manifestFile,
        `${JSON.stringify({
          version: 1,
          file: basename(outputFile),
          href,
          hash,
          icons: countCatalogIcons(result.catalog),
        }, null, 2)}\n`,
      )
      if (options.clean) {
        await removeStaleHashedCSS(dirname(outputFile), basename(output), outputFile)
      }
    },
  }
}

interface WrittenCSSFile {
  file: string
  hash: string
  href: string
  icons: number
  priority?: boolean
}

async function writeGlobalCSSArtifact(
  result: IconcatCSSArtifactInput,
  options: IconcatCSSArtifactOptions,
) {
  const output = options.output || '.iconcat/iconcat.[hash].css'
  const manifest = options.manifest || '.iconcat/manifest.json'
  const publicPath = options.publicPath || '/assets'
  const cwd = result.cwd || process.cwd()
  const manifestFile = resolve(cwd, manifest)
  const outputDirectory = dirname(resolve(cwd, output))
  const catalog = normalizeIconcatCatalog(result.catalog)
  const priorityIcons = mergeCatalogInputs(
    ...Object.values(catalog.entries || {})
      .filter((entry) => entry.priority)
      .map((entry) => entry.icons),
  )
  const normalIcons = subtractCatalogIcons(catalog.icons, priorityIcons)
  const files: Record<string, {
    file: string
    hash: string
    href: string
    icons: number
  }> = {}
  const writtenFiles: string[] = []

  for (const layer of [
    { name: 'priority', icons: priorityIcons },
    { name: 'normal', icons: normalIcons },
  ] as const) {
    const css = generateIconcatCSS({
      version: 1,
      icons: layer.icons,
    }, options)
    const icons = countIcons(layer.icons)

    if (!css) {
      continue
    }

    const written = await writeCSSFile({
      cwd,
      css,
      icons,
      output,
      publicPath,
    })

    files[layer.name] = {
      file: written.file,
      hash: written.hash,
      href: written.href,
      icons: written.icons,
    }
    writtenFiles.push(resolve(cwd, formatHashedOutput(output, written.hash)))
  }

  await mkdir(dirname(manifestFile), { recursive: true })
  await atomicWriteFile(
    manifestFile,
    `${JSON.stringify({
      version: 1,
      mode: 'global',
      files,
      icons: countCatalogIcons(catalog),
    }, null, 2)}\n`,
  )

  if (options.clean) {
    await removeStaleHashedCSS(
      outputDirectory,
      basename(output),
      ...writtenFiles,
    )
  }
}

async function writePageCSSArtifact(
  result: IconcatCSSArtifactInput,
  options: IconcatCSSArtifactOptions,
) {
  const output = options.output || '.iconcat/iconcat.[hash].css'
  const manifest = options.manifest || '.iconcat/manifest.json'
  const publicPath = options.publicPath || '/assets'
  const cwd = result.cwd || process.cwd()
  const manifestFile = resolve(cwd, manifest)
  const outputDirectory = dirname(resolve(cwd, output))
  const catalog = normalizeIconcatCatalog(result.catalog)
  const routes = getPageModeRoutes(catalog)
  const autoGlobalEntries = options.autoGlobalCommonNextAppLayouts === false
    ? new Set<string>()
    : getCommonNextAppLayoutEntries(routes)
  if (options.autoGlobalNextPagesApp !== false) {
    for (const entryName of Object.keys(catalog.entries || {})) {
      if (isNextPagesAppEntry(entryName)) {
        autoGlobalEntries.add(entryName)
      }
    }
  }
  const globalEntries = Object.entries(catalog.entries || {})
    .filter(([entryName, entry]) => entry.scope === 'global' || autoGlobalEntries.has(entryName))
  const pageEntries = Object.entries(catalog.entries || {})
    .filter(([entryName, entry]) => entry.scope !== 'global' && !autoGlobalEntries.has(entryName))
  const globalIcons = mergeCatalogInputs(...globalEntries.map(([, entry]) => entry.icons))
  const global: WrittenCSSFile[] = []
  const pages: Record<string, WrittenCSSFile[]> = {}
  const writtenFiles = new Map<string, string>()
  const writtenByHash = new Map<string, WrittenCSSFile>()

  const globalFile = await writeCSSLayer({
    cwd,
    icons: globalIcons,
    options,
    output,
    priority: true,
    publicPath,
    writtenByHash,
    writtenFiles,
  })

  if (globalFile) {
    global.push(globalFile)
  }

  for (const [entryName, entry] of pageEntries.sort(([left], [right]) => left.localeCompare(right))) {
    const pageIcons = subtractCatalogIcons(entry.icons, globalIcons)
    const written = await writeCSSLayer({
      cwd,
      icons: pageIcons,
      options,
      output,
      priority: entry.priority,
      publicPath,
      writtenByHash,
      writtenFiles,
    })

    pages[entryName] = written ? [written] : []
  }

  await mkdir(dirname(manifestFile), { recursive: true })
  await atomicWriteFile(
    manifestFile,
    `${JSON.stringify({
      version: 1,
      mode: 'page',
      global,
      pages,
      ...(Object.keys(routes).length > 0 ? { routes } : {}),
      icons: countCatalogIcons(catalog),
    }, null, 2)}\n`,
  )

  if (options.clean) {
    await removeStaleHashedCSS(
      outputDirectory,
      basename(output),
      ...Array.from(writtenFiles.values()),
    )
  }
}

function getPageModeRoutes(catalog: IconcatCatalog) {
  const entryNames = new Set(Object.keys(catalog.entries || {}))
  const routes: Record<string, string[]> = {}

  for (const entryName of entryNames) {
    if (!isNextAppRouterPageEntry(entryName)) {
      continue
    }

    const entries = getNextAppRouterRouteEntriesFromCandidates(entryName, entryNames)

    if (entries.length > 1) {
      routes[entryName] = entries
    }
  }

  return routes
}

function getCommonNextAppLayoutEntries(routes: Record<string, string[]>) {
  const routeEntries = Object.values(routes)

  if (!routeEntries.length) {
    return new Set<string>()
  }

  const [firstRouteEntries = []] = routeEntries
  const commonEntries = firstRouteEntries
    .filter((entry) =>
      isNextAppLayoutEntry(entry)
      && routeEntries.every((entries) => entries.includes(entry)))

  return new Set(commonEntries)
}

function isNextAppLayoutEntry(entry: string) {
  const leaf = entry.split('/').at(-1) || ''

  if (!leaf.startsWith('layout.')) {
    return false
  }

  const extension = leaf.slice('layout.'.length)
  const leafExtension = extension.split('.').at(-1)

  return ['js', 'jsx', 'ts', 'tsx'].includes(leafExtension || '')
}

function isNextPagesAppEntry(entry: string) {
  const segments = entry.split('/')
  const leaf = segments.at(-1) || ''

  if (!leaf.startsWith('_app.')) {
    return false
  }

  const extension = leaf.slice('_app.'.length)
  const leafExtension = extension.split('.').at(-1)
  const isPagesRoot = segments.length === 2 && segments[0] === 'pages'
  const isSrcPagesRoot = segments.length === 3 && segments[0] === 'src' && segments[1] === 'pages'

  return (isPagesRoot || isSrcPagesRoot)
    && ['js', 'jsx', 'ts', 'tsx'].includes(leafExtension || '')
}

async function writeCSSLayer(
  input: {
    cwd: string
    icons: IconCatalogInput
    options: IconcatCSSArtifactOptions
    output: string
    priority?: boolean
    publicPath: string
    writtenByHash: Map<string, WrittenCSSFile>
    writtenFiles: Map<string, string>
  },
) {
  const css = generateIconcatCSS({
    version: 1,
    icons: normalizeCatalogInput(input.icons),
  }, input.options)
  const icons = countIcons(input.icons)

  if (!css) {
    return
  }

  const hash = createHash('sha256')
    .update(css)
    .digest('hex')
    .slice(0, 10)
  const cached = input.writtenByHash.get(hash)

  if (cached) {
    return {
      ...cached,
      priority: input.priority || undefined,
    }
  }

  const written = await writeCSSFile({
    cwd: input.cwd,
    css,
    icons,
    output: input.output,
    publicPath: input.publicPath,
  })

  input.writtenByHash.set(hash, written)
  input.writtenFiles.set(hash, resolve(input.cwd, formatHashedOutput(input.output, hash)))

  return {
    ...written,
    priority: input.priority || undefined,
  }
}

async function writeCSSFile(
  input: {
    cwd: string
    css: string
    icons: number
    output: string
    publicPath: string
  },
): Promise<WrittenCSSFile> {
  const hash = createHash('sha256')
    .update(input.css)
    .digest('hex')
    .slice(0, 10)
  const outputFile = resolve(input.cwd, formatHashedOutput(input.output, hash))
  const file = basename(outputFile)

  await atomicWriteFile(outputFile, `${input.css}\n`)

  return {
    file,
    hash,
    href: joinUrl(input.publicPath, file),
    icons: input.icons,
  }
}

function normalizeCatalogInput(catalog: IconCatalogInput) {
  return isIconcatCatalog(catalog)
    ? normalizeIconcatCatalog(catalog).icons
    : normalizeCatalogIcons(catalog)
}

function isIconcatCatalog(
  catalog: IconCatalogInput,
): catalog is IconcatCatalog {
  return 'version' in catalog && 'icons' in catalog
}

async function removeStaleHashedCSS(
  directory: string,
  pattern: string,
  ...keepFiles: string[]
) {
  if (!pattern.includes('[hash]')) {
    return
  }

  const ext = extname(pattern)
  const [prefix, suffix = ''] = pattern.split('[hash]')
  const files = await readdir(directory).catch(() => [])

  await Promise.all(
    files
      .filter((file) =>
        file.startsWith(prefix)
        && file.endsWith(suffix || ext)
        && !keepFiles.includes(resolve(directory, file)))
      .map((file) => rm(resolve(directory, file), { force: true })),
  )
}

async function atomicWriteFile(file: string, content: string) {
  await mkdir(dirname(file), { recursive: true })
  const tempFile = `${file}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tempFile, content)
  await rename(tempFile, file)
}

function joinUrl(base: string, file: string) {
  return `${base.replace(/\/$/, '')}/${file}`
}

function countCatalogIcons(catalog: IconcatCatalog) {
  return Object.values(normalizeIconcatCatalog(catalog).icons)
    .reduce((total, names) => total + names.length, 0)
}

function countIcons(icons: IconCatalogInput) {
  return Object.values(normalizeCatalogInput(icons))
    .reduce((total, names) => total + names.length, 0)
}

function mergeCatalogInputs(...catalogs: IconCatalogInput[]) {
  return mergeCatalogIcons(...catalogs.map((catalog) => normalizeCatalogInput(catalog)))
}

function subtractCatalogIcons(
  icons: IconCatalogInput,
  excluded: IconCatalogInput,
) {
  const normalized = normalizeCatalogInput(icons)
  const excludedIcons = normalizeCatalogInput(excluded)
  const output: Record<string, string[]> = {}

  for (const [prefix, names] of Object.entries(normalized)) {
    const excludedNames = new Set(excludedIcons[prefix] || [])
    const remainingNames = names.filter((name) => !excludedNames.has(name))

    if (remainingNames.length > 0) {
      output[prefix] = remainingNames
    }
  }

  return output
}

function formatHashedOutput(output: string, hash: string) {
  if (output.includes('[hash]')) {
    return output.replace('[hash]', hash)
  }

  throw new Error('Iconcat global CSS artifact output must include [hash].')
}
