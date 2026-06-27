import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { resolve } from 'pathe'
import { describe, expect, it } from 'vitest'

import {
  createEsbuildBundler,
  createMemoryIconcatExtractionCache,
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
})
