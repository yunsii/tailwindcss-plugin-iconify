import { readFileSync } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'

export interface IconcatCSSManifest {
  file?: string
  href?: string
  version?: number
  hash?: string
  icons?: number
  mode?: 'entry' | 'global' | 'page'
  files?: Record<string, IconcatCSSManifestFile>
  entries?: Record<string, IconcatCSSManifestEntry>
  global?: IconcatCSSManifestFile[]
  pages?: Record<string, IconcatCSSManifestFile[]>
  pageRoutes?: Record<string, string>
  routes?: Record<string, string[]>
}

export interface IconcatCSSManifestFile {
  file: string
  hash?: string
  href: string
  icons?: number
  priority?: boolean
}

export interface IconcatCSSManifestEntry {
  file?: string
  hash?: string
  href?: string
  icons?: number
  priority?: boolean
}

export type IconcatPageRoute = `/${string}`

export interface ReadIconcatManifestOptions {
  cwd?: string
  manifest?: string
}

export interface InstallIconcatCSSOptions extends ReadIconcatManifestOptions {
  sourceDir?: string
  targetDir: string
}

export function joinPublicPath(prefix: string, path: string) {
  const normalizedPrefix = prefix.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${normalizedPrefix}${normalizedPath}`
}

export async function readIconcatManifest(
  options: ReadIconcatManifestOptions = {},
) {
  const manifestFile = resolveManifestFile(options)
  return JSON.parse(await readFile(manifestFile, 'utf8')) as IconcatCSSManifest
}

export function readIconcatManifestSync(
  options: ReadIconcatManifestOptions = {},
) {
  const manifestFile = resolveManifestFile(options)
  return JSON.parse(readFileSync(manifestFile, 'utf8')) as IconcatCSSManifest
}

export function getIconcatCSSHref(options: ReadIconcatManifestOptions = {}) {
  try {
    const manifest = readIconcatManifestSync(options)
    return getIconcatCSSHrefsFromManifest(manifest)[0]
  } catch {
    return undefined
  }
}

export function getIconcatCSSHrefs(options: ReadIconcatManifestOptions = {}) {
  try {
    return getIconcatCSSHrefsFromManifest(readIconcatManifestSync(options))
  } catch {
    return []
  }
}

export function getIconcatPriorityCSSHrefs(options: ReadIconcatManifestOptions = {}) {
  try {
    return getIconcatPriorityCSSHrefsFromManifest(readIconcatManifestSync(options))
  } catch {
    return []
  }
}

export function getIconcatEntryCSSHref(
  entry: string,
  options: ReadIconcatManifestOptions = {},
) {
  try {
    return readIconcatManifestSync(options).entries?.[entry]?.href
  } catch {
    return undefined
  }
}

export function getIconcatPageCSSHrefs(
  page: IconcatPageRoute,
  options: ReadIconcatManifestOptions = {},
) {
  return getIconcatPageCSSHrefsFromManifest(readIconcatManifestSync(options), page)
}

export function getIconcatPageCSSFiles(
  page: IconcatPageRoute,
  options: ReadIconcatManifestOptions = {},
) {
  return getIconcatPageCSSFilesFromManifest(readIconcatManifestSync(options), page)
}

export async function installIconcatCSS(
  options: InstallIconcatCSSOptions,
) {
  const cwd = options.cwd || process.cwd()
  const manifest = await readIconcatManifest(options)
  const sourceDir = options.sourceDir || dirname(resolveManifestFile(options))
  const files = getIconcatManifestFiles(manifest)
  const installed = await Promise.all(files.map(async (file) => {
    const source = resolve(cwd, sourceDir, file)
    const target = resolve(cwd, options.targetDir, basename(file))

    await mkdir(dirname(target), { recursive: true })
    await atomicWriteFile(target, await readFile(source, 'utf8'))

    return {
      source,
      target,
    }
  }))

  const [first] = installed

  return {
    manifest,
    source: first?.source,
    target: first?.target,
    files: installed,
  }
}

export function resolveManifestFile(
  options: ReadIconcatManifestOptions = {},
) {
  return resolve(options.cwd || process.cwd(), options.manifest || '.iconcat/manifest.json')
}

async function atomicWriteFile(file: string, content: string) {
  const tempFile = `${file}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tempFile, content)
  await rename(tempFile, file)
}

function isEntryManifest(manifest: IconcatCSSManifest) {
  return manifest.mode === 'entry' && !!manifest.entries
}

export function getIconcatPriorityCSSHrefsFromManifest(manifest: IconcatCSSManifest) {
  if (manifest.mode === 'page') {
    return (manifest.global || [])
      .filter((file) => file.priority)
      .map((file) => file.href)
  }

  if (manifest.mode === 'global') {
    return manifest.files?.priority?.href ? [manifest.files.priority.href] : []
  }

  if (!isEntryManifest(manifest)) {
    return manifest.href ? [manifest.href] : []
  }

  return [
    ...new Set(
      Object.entries(manifest.entries || {})
        .filter(([, entry]) => entry.priority)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([, entry]) => entry.href)
        .filter(isDefined),
    ),
  ]
}

export function getIconcatCSSHrefsFromManifest(manifest: IconcatCSSManifest) {
  if (manifest.href) {
    return [manifest.href]
  }

  if (manifest.mode === 'page') {
    return (manifest.global || []).map((file) => file.href)
  }

  if (manifest.files) {
    return getOrderedManifestFiles(manifest)
      .map((file) => file.href)
  }

  return []
}

export function getIconcatPageCSSHrefsFromManifest(
  manifest: IconcatCSSManifest,
  page: IconcatPageRoute,
) {
  return getIconcatPageCSSFilesFromManifest(manifest, page)
    .map((file) => file.href)
}

export function getIconcatPageCSSFilesFromManifest(
  manifest: IconcatCSSManifest,
  page: IconcatPageRoute,
) {
  if (manifest.mode === 'page') {
    const pageEntry = resolveIconcatPageEntryFromManifestOrThrow(manifest, page)
    return orderManifestFiles(manifest.pages?.[pageEntry] || [])
  }

  return []
}

export function resolveIconcatPageEntryFromManifest(
  manifest: IconcatCSSManifest,
  page: IconcatPageRoute,
) {
  return manifest.pageRoutes?.[normalizeIconcatRoutePath(page)]
}

export function resolveIconcatPageEntryFromManifestOrThrow(
  manifest: IconcatCSSManifest,
  page: IconcatPageRoute,
) {
  const pageEntry = resolveIconcatPageEntryFromManifest(manifest, page)

  if (!pageEntry || !Object.hasOwn(manifest.pages || {}, pageEntry)) {
    throw createMissingIconcatPageRouteError(manifest, page, pageEntry)
  }

  return pageEntry
}

export function hasIconcatPageEntryInManifest(
  manifest: IconcatCSSManifest,
  page: IconcatPageRoute,
) {
  const pageEntry = resolveIconcatPageEntryFromManifest(manifest, page)

  return !!pageEntry && Object.hasOwn(manifest.pages || {}, pageEntry)
}

export function createMissingIconcatPageRouteError(
  manifest: IconcatCSSManifest,
  page: IconcatPageRoute,
  pageEntry = resolveIconcatPageEntryFromManifest(manifest, page),
) {
  const knownRoutes = Object.keys(manifest.pageRoutes || {}).sort()
  return new Error(
    `[iconcat] Page CSS entry "${page}" was not found in the generated manifest. `
    + `Iconcat page CSS helpers only accept route paths generated in manifest.pageRoutes. `
    + `Resolved entry: "${pageEntry || '(none)'}". Re-run iconcat extraction or check the route. `
    + `Known routes: ${knownRoutes.length ? knownRoutes.join(', ') : '(none)'}.`,
  )
}

export function normalizeIconcatRoutePath(page: string) {
  if (!page.startsWith('/')) {
    return page
  }

  const normalized = page.replace(/\/+$/, '')

  return normalized || '/'
}

export function getIconcatManifestFiles(manifest: IconcatCSSManifest) {
  if (manifest.mode === 'page') {
    return [
      ...new Set([
        ...(manifest.global || []),
        ...Object.entries(manifest.pages || {})
          .sort(([left], [right]) => left.localeCompare(right))
          .flatMap(([, files]) => files),
      ].map((file) => file.file)),
    ]
  }

  if (manifest.files) {
    return getOrderedManifestFiles(manifest)
      .map((file) => file.file)
  }

  return manifest.file ? [manifest.file] : []
}

function getOrderedManifestFiles(manifest: IconcatCSSManifest) {
  if (!manifest.files) {
    return []
  }

  if (manifest.mode === 'global') {
    return [
      manifest.files.priority,
      manifest.files.normal,
    ].filter(isDefined)
  }

  return Object.entries(manifest.files)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, file]) => file)
}

function orderManifestFiles(files: IconcatCSSManifestFile[]) {
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

export {
  getConventionalNextAppRouterPageEntries,
  getNextAppRouterPageCSSFilesFromManifest as getIconcatNextAppRouterPageCSSFilesFromManifest,
  getNextAppRouterPageCSSHrefsFromManifest as getIconcatNextAppRouterPageCSSHrefsFromManifest,
  getNextAppRouterPageManifestEntries,
  getNextAppRouterRouteEntriesFromCandidates,
  isNextAppRouterPageEntry,
  isNextAppRouterParallelSlotEntry,
  resolveNextAppRouterAncestorEntries,
  resolveNextAppRouterPageEntries,
  resolveNextAppRouterPageRoute,
} from './next-app-router'
