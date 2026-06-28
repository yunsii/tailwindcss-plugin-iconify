import { access, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

import type { IconcatCSSManifest, IconcatCSSManifestFile, IconcatPageRoute } from './index'

export const NEXT_APP_ROUTER_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx'] as const
export const NEXT_APP_ROUTER_SEGMENT_FILES = [
  'layout',
  'template',
  'error',
  'loading',
  'not-found',
  'forbidden',
  'unauthorized',
  'default',
] as const
const NEXT_APP_ROUTER_PARALLEL_SLOT_FALLBACK_FILES = ['default'] as const

export interface ResolveNextAppRouterPageEntriesOptions {
  cwd?: string
  pageExtensions?: string[]
}

export async function resolveNextAppRouterPageEntries(
  page: string,
  options: ResolveNextAppRouterPageEntriesOptions = {},
) {
  const appRoot = getNextAppRoot(page)

  if (!appRoot || !isNextAppPageFile(page)) {
    return [page]
  }

  const cwd = options.cwd || process.cwd()
  const pageExtensions = getNextAppSegmentSearchExtensions(options.pageExtensions)
  const directories = getNextAppAncestorDirectories(page, appRoot)
  const files = await Promise.all(
    directories.map((directory) => resolveNextAppRouterDirectoryEntries(cwd, directory, pageExtensions)),
  )

  return [
    ...files.flat().filter(isDefined),
    page,
  ]
}

export async function resolveNextAppRouterAncestorEntries(
  pages: string[],
  options: ResolveNextAppRouterPageEntriesOptions = {},
) {
  const entries = await Promise.all(
    pages
      .filter(isNextAppPageFile)
      .map((page) => resolveNextAppRouterPageEntries(page, options)),
  )

  return [...new Set(entries.flat().filter((entry) => !pages.includes(entry)))].sort()
}

export function getNextAppRouterPageCSSFilesFromManifest(
  manifest: IconcatCSSManifest,
  page: IconcatPageRoute,
) {
  if (manifest.mode !== 'page') {
    return []
  }

  const pageEntry = resolveManifestPageEntryOrThrow(manifest, page)

  return orderNextAppRouterManifestFiles(
    getNextAppRouterPageManifestEntriesForEntry(manifest, pageEntry)
      .flatMap((entry) => manifest.pages?.[entry] || []),
  )
}

export function getNextAppRouterPageCSSHrefsFromManifest(
  manifest: IconcatCSSManifest,
  page: IconcatPageRoute,
) {
  return getNextAppRouterPageCSSFilesFromManifest(manifest, page)
    .map((file) => file.href)
}

export function getNextAppRouterPageManifestEntries(
  manifest: IconcatCSSManifest,
  page: IconcatPageRoute,
) {
  const pageEntry = resolveManifestPageEntryOrThrow(manifest, page)

  return getNextAppRouterPageManifestEntriesForEntry(manifest, pageEntry)
}

function getNextAppRouterPageManifestEntriesForEntry(
  manifest: IconcatCSSManifest,
  pageEntry: string,
) {
  return manifest.routes?.[pageEntry] || getConventionalNextAppRouterPageEntries(pageEntry)
}

export function getNextAppRouterRouteEntriesFromCandidates(
  page: string,
  candidates: Iterable<string>,
  options: Pick<ResolveNextAppRouterPageEntriesOptions, 'pageExtensions'> = {},
) {
  const candidateSet = new Set(candidates)
  const appRoot = getNextAppRoot(page)

  if (!appRoot || !isNextAppPageFile(page)) {
    return candidateSet.has(page) ? [page] : []
  }

  const pageExtensions = getNextAppRouteExtensions(page, candidateSet, options.pageExtensions)

  return [
    ...getNextAppAncestorDirectories(page, appRoot)
      .flatMap((directory) => [
        ...NEXT_APP_ROUTER_SEGMENT_FILES.flatMap((name) =>
          pageExtensions.map((extension) => `${directory}/${name}.${extension}`)),
        ...getNextAppParallelSlotFallbackEntriesFromCandidates(directory, candidateSet, pageExtensions),
      ]),
    page,
  ].filter((entry) => candidateSet.has(entry))
}

export function getConventionalNextAppRouterPageEntries(page: string) {
  const appRoot = getNextAppRoot(page)

  if (!appRoot || !isNextAppPageFile(page)) {
    return [page]
  }

  const [pageExtension = 'tsx'] = getNextAppPageExtensions(page)

  return [
    ...getNextAppAncestorDirectories(page, appRoot)
      .flatMap((directory) =>
        NEXT_APP_ROUTER_SEGMENT_FILES.map((name) => `${directory}/${name}.${pageExtension}`)),
    page,
  ]
}

export function isNextAppRouterPageEntry(file: string) {
  return isNextAppPageFile(file)
}

export function resolveNextAppRouterPageRoute(entry: string) {
  const appRoot = getNextAppRoot(entry)

  if (!appRoot || !isNextAppPageFile(entry)) {
    return undefined
  }

  const segments = entry.split('/').slice(appRoot.length, -1)
  const routeSegments = segments
    .filter((segment) => !isNextAppRouteGroup(segment))
    .filter((segment) => !segment.startsWith('@'))
    .map(stripNextAppInterceptingRouteMarker)

  return `/${routeSegments.join('/')}`.replace(/\/+$/, '') || '/'
}

export function isNextAppRouterParallelSlotEntry(entry: string) {
  return entry.split('/').some((segment) => segment.startsWith('@'))
}

function resolveManifestPageEntry(
  manifest: IconcatCSSManifest,
  page: IconcatPageRoute,
) {
  return manifest.pageRoutes?.[normalizeRoutePath(page)]
}

function resolveManifestPageEntryOrThrow(
  manifest: IconcatCSSManifest,
  page: IconcatPageRoute,
) {
  const pageEntry = resolveManifestPageEntry(manifest, page)

  if (!pageEntry) {
    const knownRoutes = Object.keys(manifest.pageRoutes || {}).sort()

    throw new Error(
      `[iconcat] App Router page CSS entry "${page}" was not found in the generated manifest. `
      + `Iconcat App Router page helpers only accept route paths generated in manifest.pageRoutes. `
      + `Known routes: ${knownRoutes.length ? knownRoutes.join(', ') : '(none)'}.`,
    )
  }

  return pageEntry
}

function normalizeRoutePath(page: IconcatPageRoute) {
  const normalized = page.replace(/\/+$/, '')

  return normalized || '/'
}

function isNextAppRouteGroup(segment: string) {
  return segment.startsWith('(') && segment.endsWith(')')
}

function stripNextAppInterceptingRouteMarker(segment: string) {
  return segment.replace(/^\(\.{1,3}\)/, '')
}

function getNextAppAncestorDirectories(page: string, appRoot: string[]) {
  const segments = page.split('/')
  const pageDirectorySegments = segments.slice(0, -1)
  const directories: string[] = []

  for (let index = appRoot.length; index <= pageDirectorySegments.length; index += 1) {
    directories.push([...appRoot, ...pageDirectorySegments.slice(appRoot.length, index)].join('/'))
  }

  return directories
}

async function resolveNextAppRouterDirectoryEntries(
  cwd: string,
  directory: string,
  pageExtensions: string[],
) {
  const files = await Promise.all([
    ...NEXT_APP_ROUTER_SEGMENT_FILES.map((name) =>
      findNextAppFile(cwd, directory, name, pageExtensions)),
    resolveNextAppParallelSlotFallbackEntries(cwd, directory, pageExtensions),
  ])

  return files.flat().filter(isDefined)
}

async function findNextAppFile(
  cwd: string,
  directory: string,
  name: typeof NEXT_APP_ROUTER_SEGMENT_FILES[number] | typeof NEXT_APP_ROUTER_PARALLEL_SLOT_FALLBACK_FILES[number],
  pageExtensions: string[],
) {
  for (const extension of pageExtensions) {
    const file = `${directory}/${name}.${extension}`

    if (await fileExists(resolve(cwd, file))) {
      return file
    }
  }

  return undefined
}

async function resolveNextAppParallelSlotFallbackEntries(
  cwd: string,
  directory: string,
  pageExtensions: string[],
) {
  const entries = await readdir(resolve(cwd, directory), { withFileTypes: true })
    .catch(() => [])
  const slots = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('@'))
    .map((entry) => `${directory}/${entry.name}`)
    .sort()
  const files = await Promise.all(
    slots.flatMap((slot) =>
      NEXT_APP_ROUTER_PARALLEL_SLOT_FALLBACK_FILES.map((name) =>
        findNextAppFile(cwd, slot, name, pageExtensions))),
  )

  return files.filter(isDefined)
}

function getNextAppParallelSlotFallbackEntriesFromCandidates(
  directory: string,
  candidateSet: Set<string>,
  pageExtensions: string[],
) {
  const slotDirectories = getDirectParallelSlotDirectoriesFromCandidates(directory, candidateSet)

  return slotDirectories.flatMap((slotDirectory) =>
    NEXT_APP_ROUTER_PARALLEL_SLOT_FALLBACK_FILES.flatMap((name) =>
      pageExtensions.map((extension) => `${slotDirectory}/${name}.${extension}`)))
}

function getNextAppRouteExtensions(
  page: string,
  candidateSet: Set<string>,
  pageExtensions?: string[],
) {
  const configuredExtensions = getConfiguredNextAppPageExtensions(pageExtensions)

  if (configuredExtensions.length) {
    return configuredExtensions
  }

  return [
    ...new Set([
      ...getNextAppPageExtensions(page),
      ...Array.from(candidateSet)
        .map(getNextAppSegmentFileExtension)
        .filter(isDefined),
    ]),
  ]
}

function getDirectParallelSlotDirectoriesFromCandidates(
  directory: string,
  candidateSet: Set<string>,
) {
  const slotDirectories = new Set<string>()
  const prefix = `${directory}/`

  for (const candidate of candidateSet) {
    if (!candidate.startsWith(prefix)) {
      continue
    }

    const [segment] = candidate.slice(prefix.length).split('/')

    if (segment?.startsWith('@')) {
      slotDirectories.add(`${directory}/${segment}`)
    }
  }

  return [...slotDirectories].sort()
}

async function fileExists(file: string) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

function isNextAppPageFile(file: string) {
  return !!getNextAppPageExtension(file)
}

function getNextAppPageExtensions(file: string, pageExtensions?: string[]) {
  const extension = getNextAppPageExtension(file)
  const normalizedPageExtensions = getConfiguredNextAppPageExtensions(pageExtensions)

  if (normalizedPageExtensions.length) {
    return normalizedPageExtensions
  }

  return extension ? [extension] : [...NEXT_APP_ROUTER_EXTENSIONS]
}

function getNextAppSegmentSearchExtensions(pageExtensions?: string[]) {
  const configuredExtensions = getConfiguredNextAppPageExtensions(pageExtensions)

  return configuredExtensions.length
    ? configuredExtensions
    : [...NEXT_APP_ROUTER_EXTENSIONS]
}

function getNextAppPageExtension(file: string) {
  if (!getNextAppRoot(file)) {
    return undefined
  }

  const leaf = file.split('/').at(-1) || ''

  if (!leaf.startsWith('page.')) {
    return undefined
  }

  const extension = leaf.slice('page.'.length)

  return isSupportedNextPageExtension(extension) ? extension : undefined
}

function getNextAppSegmentFileExtension(file: string) {
  if (!getNextAppRoot(file)) {
    return undefined
  }

  const leaf = file.split('/').at(-1) || ''
  const segmentName = NEXT_APP_ROUTER_SEGMENT_FILES.find((name) => leaf.startsWith(`${name}.`))

  if (!segmentName) {
    return undefined
  }

  const extension = leaf.slice(segmentName.length + 1)

  return isSupportedNextPageExtension(extension) ? extension : undefined
}

function getConfiguredNextAppPageExtensions(pageExtensions: string[] = []) {
  return [
    ...new Set(
      pageExtensions
        .map((extension) => extension.replace(/^\./, ''))
        .filter(isSupportedNextPageExtension),
    ),
  ]
}

function isSupportedNextPageExtension(extension: string) {
  const leafExtension = extension.split('.').at(-1)

  return NEXT_APP_ROUTER_EXTENSIONS.includes(leafExtension as typeof NEXT_APP_ROUTER_EXTENSIONS[number])
}

function getNextAppRoot(file: string) {
  const segments = file.split('/')

  if (segments[0] === 'app') {
    return ['app']
  }

  if (segments[0] === 'src' && segments[1] === 'app') {
    return ['src', 'app']
  }

  return undefined
}

function orderNextAppRouterManifestFiles(files: IconcatCSSManifestFile[]) {
  const seen = new Set<string>()
  return [
    ...files.filter((file) => file.priority),
    ...files.filter((file) => !file.priority),
  ]
    .filter((file) => {
      if (seen.has(file.href)) {
        return false
      }
      seen.add(file.href)
      return true
    })
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}
