import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { resolve } from 'pathe'
import { describe, expect, it } from 'vitest'

import {
  createEsbuildBundler,
  createMemoryIconcatExtractionCache,
  createPersistentIconcatExtractionCache,
  extractIconCatalog,
} from '../src'
import { createRolldownBundler } from '../src/rolldown'

import type { IconcatBundler } from '../src'

const bundlers = [
  createEsbuildBundler(),
  createRolldownBundler(),
]

describe('entry graph extraction', () => {
  it('extracts only icons reachable from explicit entries', async () => {
    const result = await extractIconCatalog({
      cwd: resolve(__dirname, 'fixtures/basic'),
      entries: ['src/main.tsx'],
    })

    expect(result.catalog.icons).toEqual({
      'line-md': ['loading-loop'],
      'mdi-light': ['home'],
    })
    expect(result.catalog.icons['mdi-light']).not.toContain('account')
  })

  it('extracts all explicit entries and keeps per-entry usage', async () => {
    const result = await extractIconCatalog({
      cwd: resolve(__dirname, 'fixtures/basic'),
      entries: ['src/main.tsx', 'src/admin.tsx'],
    })

    expect(result.catalog.icons).toEqual({
      'line-md': ['loading-loop'],
      'mdi-light': ['cog', 'home'],
    })
    expect(Object.keys(result.catalog.entries || {})).toEqual([
      'src/admin.tsx',
      'src/main.tsx',
    ])
  })

  it('keeps priority metadata for object entries', async () => {
    const result = await extractIconCatalog({
      cwd: resolve(__dirname, 'fixtures/basic'),
      entries: [
        { file: 'src/main.tsx', priority: true },
        'src/admin.tsx',
      ],
    })

    expect(result.catalog.entries?.['src/main.tsx']?.priority).toBe(true)
    expect(result.catalog.entries?.['src/admin.tsx']?.priority).toBeUndefined()
    expect(result.graph.entries.find((entry) => entry.file === 'src/main.tsx')?.priority).toBe(true)
  })

  it('extracts page-level allowlist icons declared with defineIconcatIcons', async () => {
    const cwd = resolve(tmpdir(), `iconcat-allowlist-test-${process.pid}`)

    await rm(cwd, { force: true, recursive: true })
    await mkdir(resolve(cwd, 'src'), { recursive: true })
    await writeFile(
      resolve(cwd, 'src/page.tsx'),
      [
        'import { defineIconcatIcons } from "iconcat"',
        'const widgetIcons = defineIconcatIcons([',
        '  "custom-dashboard:sales",',
        '  "mdi-light:chart-line",',
        '])',
        'export const icons = widgetIcons',
      ].join('\n'),
    )

    const result = await extractIconCatalog({
      cwd,
      entries: ['src/page.tsx'],
    })

    expect(result.catalog.entries?.['src/page.tsx']?.icons).toEqual({
      'custom-dashboard': ['sales'],
      'mdi-light': ['chart-line'],
    })
  })

  it('ignores common non-icon protocol-like string literals', async () => {
    const result = await extractIconCatalog({
      cwd: resolve(__dirname, 'fixtures/protocols'),
      entries: ['src/main.ts'],
    })

    expect(result.catalog.icons).toEqual({})
  })

  it('keeps reachable icon catalog parity between esbuild and rolldown', async () => {
    const config = {
      cwd: resolve(__dirname, 'fixtures/basic'),
      entries: ['src/main.tsx', 'src/admin.tsx'],
    }
    const esbuild = await extractIconCatalog({
      ...config,
      bundler: createEsbuildBundler(),
    })
    const rolldown = await extractIconCatalog({
      ...config,
      bundler: createRolldownBundler(),
    })

    expect(rolldown.catalog.icons).toEqual(esbuild.catalog.icons)
    expect(rolldown.graph.entries).toEqual(esbuild.graph.entries)
    expect(rolldown.graph.modules).toEqual(esbuild.graph.modules)
  })

  it.each(bundlers)('traverses dynamic imports and shared chunks with $name', async (bundler) => {
    const result = await extractIconCatalog({
      cwd: resolve(__dirname, 'fixtures/dynamic'),
      entries: ['src/entry.ts'],
      bundler,
    })

    expect(result.catalog.icons).toEqual({
      'line-md': ['shared'],
      'mdi-light': ['eager', 'lazy'],
    })
    expect(result.graph.modules).toEqual([
      'src/eager.ts',
      'src/entry.ts',
      'src/lazy.ts',
      'src/shared.ts',
    ])
  })

  it.each(bundlers)('supports entries outside src with $name', async (bundler) => {
    const result = await extractIconCatalog({
      cwd: resolve(__dirname, 'fixtures/non-src'),
      entries: ['app/entry.ts'],
      bundler,
    })

    expect(result.catalog.icons).toEqual({
      'line-md': ['non-src-panel'],
      'mdi-light': ['non-src-entry'],
    })
    expect(result.graph.modules).toEqual([
      'app/entry.ts',
      'app/panel.ts',
    ])
  })

  it.each(bundlers)('externalizes assets while preserving source modules with $name', async (bundler) => {
    const result = await extractIconCatalog({
      cwd: resolve(__dirname, 'fixtures/assets'),
      entries: ['src/entry.ts'],
      bundler,
    })

    expect(result.catalog.icons).toEqual({
      'mdi-light': ['asset-entry'],
    })
    expect(result.graph.modules).toEqual(['src/entry.ts'])
  })

  it.each([
    createEsbuildBundler({ includeDeps: ['icon-dep'] }),
    createRolldownBundler({ includeDeps: ['icon-dep'] }),
  ])('includes opted-in dependencies with $name', async (bundler) => {
    const result = await extractIconCatalog({
      cwd: resolve(__dirname, 'fixtures/deps'),
      entries: ['src/entry.ts'],
      bundler,
    })

    expect(result.catalog.icons).toEqual({
      'line-md': ['entry'],
      'mdi-light': ['dep'],
    })
    expect(result.graph.modules).toEqual([
      'node_modules/icon-dep/index.js',
      'src/entry.ts',
    ])
  })

  it('reuses cached module extraction when files are unchanged', async () => {
    const cache = createMemoryIconcatExtractionCache()
    const cwd = resolve(tmpdir(), `iconcat-cache-test-${process.pid}`)

    await rm(cwd, { force: true, recursive: true })
    await mkdir(resolve(cwd, 'src'), { recursive: true })
    await writeFile(
      resolve(cwd, 'src/entry.ts'),
      'import { shared } from \'./shared\'\nexport const icons = [\'mdi-light:home\', shared]\n',
    )
    await writeFile(
      resolve(cwd, 'src/shared.ts'),
      'export const shared = \'line-md:loading-loop\'\n',
    )

    const first = await extractIconCatalog({
      cwd,
      entries: ['src/entry.ts'],
      cache,
    })
    expect(first.catalog.icons).toEqual({
      'line-md': ['loading-loop'],
      'mdi-light': ['home'],
    })
    expect(cache.size()).toBe(2)

    await writeFile(
      resolve(cwd, 'src/shared.ts'),
      'export const shared = \'line-md:loading-loop\'\n',
    )

    const second = await extractIconCatalog({
      cwd,
      entries: ['src/entry.ts'],
      cache,
    })

    expect(second.catalog.icons).toEqual(first.catalog.icons)
    expect(cache.size()).toBe(2)

    await writeFile(
      resolve(cwd, 'src/shared.ts'),
      'export const shared = \'line-md:confirm-circle\'\n',
    )

    const third = await extractIconCatalog({
      cwd,
      entries: ['src/entry.ts'],
      cache,
    })

    expect(third.catalog.icons).toEqual({
      'line-md': ['confirm-circle'],
      'mdi-light': ['home'],
    })
    expect(cache.size()).toBe(3)
  })

  it('reuses cached bundle graph when dependency content is unchanged', async () => {
    const cache = createMemoryIconcatExtractionCache()
    const cwd = resolve(tmpdir(), `iconcat-bundle-cache-test-${process.pid}`)
    const esbuild = createEsbuildBundler()
    let bundleCalls = 0
    const bundler: IconcatBundler = {
      name: 'tracked-esbuild',
      async bundle(options) {
        bundleCalls += 1
        return esbuild.bundle(options)
      },
    }

    await rm(cwd, { force: true, recursive: true })
    await mkdir(resolve(cwd, 'src'), { recursive: true })
    await writeFile(
      resolve(cwd, 'src/entry.ts'),
      'import { shared } from \'./shared\'\nexport const icons = [\'mdi-light:home\', shared]\n',
    )
    await writeFile(
      resolve(cwd, 'src/shared.ts'),
      'export const shared = \'line-md:loading-loop\'\n',
    )

    const first = await extractIconCatalog({
      cwd,
      entries: ['src/entry.ts'],
      bundler,
      cache,
    })
    const second = await extractIconCatalog({
      cwd,
      entries: ['src/entry.ts'],
      bundler,
      cache,
    })

    expect(second.catalog.icons).toEqual(first.catalog.icons)
    expect(bundleCalls).toBe(1)

    await writeFile(
      resolve(cwd, 'src/shared.ts'),
      'export const shared = \'line-md:confirm-circle\'\n',
    )

    const third = await extractIconCatalog({
      cwd,
      entries: ['src/entry.ts'],
      bundler,
      cache,
    })

    expect(third.catalog.icons).toEqual({
      'line-md': ['confirm-circle'],
      'mdi-light': ['home'],
    })
    expect(bundleCalls).toBe(2)
  })

  it('persists bundle and module cache across extraction instances', async () => {
    const cwd = resolve(tmpdir(), `iconcat-persistent-cache-test-${process.pid}`)
    const cacheFile = '.iconcat/cache/test-extractor.json'
    const esbuild = createEsbuildBundler()
    let bundleCalls = 0
    const bundler: IconcatBundler = {
      name: 'tracked-persistent-esbuild',
      async bundle(options) {
        bundleCalls += 1
        return esbuild.bundle(options)
      },
    }

    await rm(cwd, { force: true, recursive: true })
    await mkdir(resolve(cwd, 'src'), { recursive: true })
    await writeFile(
      resolve(cwd, 'src/entry.ts'),
      'import { shared } from \'./shared\'\nexport const icons = [\'mdi-light:home\', shared]\n',
    )
    await writeFile(
      resolve(cwd, 'src/shared.ts'),
      'export const shared = \'line-md:loading-loop\'\n',
    )

    const firstCache = await createPersistentIconcatExtractionCache({
      cwd,
      file: cacheFile,
    })
    const first = await extractIconCatalog({
      cwd,
      entries: ['src/entry.ts'],
      bundler,
      cache: firstCache,
    })

    expect(first.catalog.icons).toEqual({
      'line-md': ['loading-loop'],
      'mdi-light': ['home'],
    })
    expect(bundleCalls).toBe(1)

    const secondCache = await createPersistentIconcatExtractionCache({
      cwd,
      file: cacheFile,
    })
    const second = await extractIconCatalog({
      cwd,
      entries: ['src/entry.ts'],
      bundler,
      cache: secondCache,
    })

    expect(second.catalog.icons).toEqual(first.catalog.icons)
    expect(bundleCalls).toBe(1)
    expect(secondCache.stats().bundleHits).toBe(1)
    expect(secondCache.stats().moduleHits).toBe(2)

    await writeFile(
      resolve(cwd, 'src/shared.ts'),
      'export const shared = \'line-md:loading-loop\'\n',
    )

    const thirdCache = await createPersistentIconcatExtractionCache({
      cwd,
      file: cacheFile,
    })
    const third = await extractIconCatalog({
      cwd,
      entries: ['src/entry.ts'],
      bundler,
      cache: thirdCache,
    })

    expect(third.catalog.icons).toEqual(first.catalog.icons)
    expect(bundleCalls).toBe(1)

    await writeFile(
      resolve(cwd, 'src/shared.ts'),
      'export const shared = \'line-md:confirm-circle\'\n',
    )

    const fourthCache = await createPersistentIconcatExtractionCache({
      cwd,
      file: cacheFile,
    })
    const fourth = await extractIconCatalog({
      cwd,
      entries: ['src/entry.ts'],
      bundler,
      cache: fourthCache,
    })

    expect(fourth.catalog.icons).toEqual({
      'line-md': ['confirm-circle'],
      'mdi-light': ['home'],
    })
    expect(bundleCalls).toBe(1)
    expect(fourthCache.stats().bundleHits).toBe(1)
    expect(fourthCache.stats().moduleHits).toBe(1)
  })

  it('refreshes persistent bundle graph when imports change', async () => {
    const cwd = resolve(tmpdir(), `iconcat-persistent-import-change-test-${process.pid}`)
    const cacheFile = '.iconcat/cache/test-extractor.json'
    const esbuild = createEsbuildBundler()
    let bundleCalls = 0
    const bundler: IconcatBundler = {
      name: 'tracked-import-change-esbuild',
      async bundle(options) {
        bundleCalls += 1
        return esbuild.bundle(options)
      },
    }

    await rm(cwd, { force: true, recursive: true })
    await mkdir(resolve(cwd, 'src'), { recursive: true })
    await writeFile(
      resolve(cwd, 'src/entry.ts'),
      'import { shared } from \'./shared\'\nexport const icons = [\'mdi-light:home\', shared]\n',
    )
    await writeFile(
      resolve(cwd, 'src/shared.ts'),
      'export const shared = \'line-md:loading-loop\'\n',
    )
    await writeFile(
      resolve(cwd, 'src/other.ts'),
      'export const other = \'mdi-light:account\'\n',
    )

    await extractIconCatalog({
      cwd,
      entries: ['src/entry.ts'],
      bundler,
      cache: await createPersistentIconcatExtractionCache({ cwd, file: cacheFile }),
    })

    await writeFile(
      resolve(cwd, 'src/entry.ts'),
      'import { shared } from \'./shared\'\nimport { other } from \'./other\'\nexport const icons = [\'mdi-light:home\', shared, other]\n',
    )

    const second = await extractIconCatalog({
      cwd,
      entries: ['src/entry.ts'],
      bundler,
      cache: await createPersistentIconcatExtractionCache({ cwd, file: cacheFile }),
    })

    expect(second.catalog.icons).toEqual({
      'line-md': ['loading-loop'],
      'mdi-light': ['account', 'home'],
    })
    expect(bundleCalls).toBe(2)
  })
})
