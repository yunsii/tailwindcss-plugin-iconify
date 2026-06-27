import { readFileSync } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import process from 'node:process'

export interface IconcatCSSManifest {
  file: string
  href: string
  version?: number
  hash?: string
  icons?: number
}

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
    return readIconcatManifestSync(options).href
  } catch {
    return undefined
  }
}

export async function installIconcatCSS(
  options: InstallIconcatCSSOptions,
) {
  const cwd = options.cwd || process.cwd()
  const manifest = await readIconcatManifest(options)
  const sourceDir = options.sourceDir || dirname(resolveManifestFile(options))
  const source = resolve(cwd, sourceDir, manifest.file)
  const target = resolve(cwd, options.targetDir, basename(manifest.file))

  await mkdir(dirname(target), { recursive: true })
  await atomicWriteFile(target, await readFile(source, 'utf8'))

  return {
    manifest,
    source,
    target,
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
