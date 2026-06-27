import { createHash } from 'node:crypto'
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, resolve } from 'node:path'
import process from 'node:process'

import {
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
  keepFile: string,
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
        && resolve(directory, file) !== keepFile)
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
