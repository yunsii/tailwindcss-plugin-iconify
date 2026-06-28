import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import {
  getIconcatCSSHrefsFromManifest,
  getIconcatManifestFiles,
  getIconcatNextAppRouterPageCSSHrefsFromManifest,
  getIconcatPageCSSFilesFromManifest,
  getIconcatPageCSSHrefsFromManifest,
  getIconcatPriorityCSSHrefs,
  getNextAppRouterPageManifestEntries,
  getNextAppRouterRouteEntriesFromCandidates,
  hasIconcatPageEntryInManifest,
  resolveIconcatPageEntryFromManifest,
  resolveNextAppRouterPageRoute,
} from '@iconcat/adapter-utils'
import { resolve } from 'pathe'
import { afterEach, describe, expect, it } from 'vitest'

import type { IconcatCSSManifest } from '@iconcat/adapter-utils'
import type { IconcatArtifact } from '@iconcat/extractor'

import { iconcat } from '../src'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })))
  roots.length = 0
})

describe('iconcat vite plugin', () => {
  it('orders global layer manifest hrefs and exposes priority hrefs', async () => {
    const cwd = await createFixture()
    await mkdir(resolve(cwd, '.iconcat'), { recursive: true })
    await writeFile(
      resolve(cwd, '.iconcat/manifest.json'),
      `${JSON.stringify({
        version: 1,
        mode: 'global',
        files: {
          normal: {
            file: 'iconcat.b.css',
            href: '/assets/iconcat.b.css',
          },
          priority: {
            file: 'iconcat.a.css',
            href: '/assets/iconcat.a.css',
          },
        },
      })}\n`,
    )

    const manifest = {
      version: 1,
      mode: 'global',
      files: {
        normal: {
          file: 'iconcat.b.css',
          href: '/assets/iconcat.b.css',
        },
        priority: {
          file: 'iconcat.a.css',
          href: '/assets/iconcat.a.css',
        },
      },
    } as const

    expect(getIconcatCSSHrefsFromManifest(manifest)).toEqual([
      '/assets/iconcat.a.css',
      '/assets/iconcat.b.css',
    ])
    expect(getIconcatPriorityCSSHrefs({ cwd })).toEqual([
      '/assets/iconcat.a.css',
    ])
  })

  it('injects only global hrefs and resolves page hrefs from page manifests', () => {
    const manifest = {
      version: 1,
      mode: 'page',
      global: [
        {
          file: 'iconcat.global.css',
          href: '/assets/iconcat.global.css',
          priority: true,
        },
      ],
      pages: {
        'src/routes/dashboard.tsx': [
          {
            file: 'iconcat.dashboard-priority.css',
            href: '/assets/iconcat.dashboard-priority.css',
            priority: true,
          },
          {
            file: 'iconcat.dashboard.css',
            href: '/assets/iconcat.dashboard.css',
          },
        ],
      },
      pageRoutes: {
        '/dashboard': 'src/routes/dashboard.tsx',
      },
    } satisfies IconcatCSSManifest

    expect(getIconcatCSSHrefsFromManifest(manifest)).toEqual([
      '/assets/iconcat.global.css',
    ])
    // @ts-expect-error Page CSS helpers only accept route paths.
    expect(() => getIconcatPageCSSFilesFromManifest(manifest, 'src/routes/dashboard.tsx'))
      .toThrow('only accept route paths')
    // @ts-expect-error Page CSS helpers only accept route paths.
    expect(resolveIconcatPageEntryFromManifest(manifest, 'src/routes/dashboard.tsx')).toBeUndefined()
    expect(resolveIconcatPageEntryFromManifest(manifest, '/dashboard')).toBe('src/routes/dashboard.tsx')
    // @ts-expect-error Page CSS helpers only accept route paths.
    expect(hasIconcatPageEntryInManifest(manifest, 'src/routes/dashboard.tsx')).toBe(false)
    expect(hasIconcatPageEntryInManifest(manifest, '/dashboard')).toBe(true)
    expect(getIconcatPageCSSFilesFromManifest(manifest, '/dashboard')).toEqual([
      expect.objectContaining({
        href: '/assets/iconcat.dashboard-priority.css',
        priority: true,
      }),
      expect.objectContaining({
        href: '/assets/iconcat.dashboard.css',
      }),
    ])
    expect(getIconcatPageCSSHrefsFromManifest(manifest, '/dashboard')).toEqual([
      '/assets/iconcat.dashboard-priority.css',
      '/assets/iconcat.dashboard.css',
    ])
    // @ts-expect-error Page CSS helpers only accept route paths.
    expect(() => getIconcatPageCSSHrefsFromManifest(manifest, 'src/routes/dashboard.tsx'))
      .toThrow('only accept route paths')
  })

  it('resolves Next App Router page CSS files from route manifests', () => {
    const manifest = {
      version: 1,
      mode: 'page',
      global: [],
      pages: {
        'src/app/dashboard/layout.tsx': [
          {
            file: 'iconcat.dashboard-layout.css',
            href: '/assets/iconcat.dashboard-layout.css',
          },
        ],
        'src/app/dashboard/settings/template.tsx': [
          {
            file: 'iconcat.settings-template.css',
            href: '/assets/iconcat.settings-template.css',
            priority: true,
          },
        ],
        'src/app/dashboard/settings/page.tsx': [
          {
            file: 'iconcat.settings-page.css',
            href: '/assets/iconcat.settings-page.css',
          },
        ],
      },
      routes: {
        'src/app/dashboard/settings/page.tsx': [
          'src/app/dashboard/settings/template.tsx',
          'src/app/dashboard/settings/page.tsx',
        ],
      },
      pageRoutes: {
        '/dashboard/settings': 'src/app/dashboard/settings/page.tsx',
      },
    } satisfies IconcatCSSManifest

    expect(getNextAppRouterPageManifestEntries(
      manifest,
      '/dashboard/settings',
    )).toEqual([
      'src/app/dashboard/settings/template.tsx',
      'src/app/dashboard/settings/page.tsx',
    ])
    expect(getIconcatNextAppRouterPageCSSHrefsFromManifest(
      manifest,
      '/dashboard/settings',
    )).toEqual([
      '/assets/iconcat.settings-template.css',
      '/assets/iconcat.settings-page.css',
    ])
  })

  it('throws when a requested page route is missing from the manifest', () => {
    const manifest = {
      version: 1,
      mode: 'page',
      global: [],
      pages: {
        'src/routes/dashboard.tsx': [],
      },
      pageRoutes: {
        '/dashboard': 'src/routes/dashboard.tsx',
      },
    } satisfies IconcatCSSManifest

    expect(() => getIconcatPageCSSFilesFromManifest(manifest, '/missing'))
      .toThrow('Page CSS entry "/missing" was not found')
  })

  it('resolves Next App Router route entries from actual candidate files', () => {
    expect(getNextAppRouterRouteEntriesFromCandidates(
      'src/app/(admin)/dashboard/page.jsx',
      [
        'src/app/layout.tsx',
        'src/app/(admin)/layout.ts',
        'src/app/(admin)/@analytics/default.tsx',
        'src/app/(admin)/error.tsx',
        'src/app/(admin)/loading.tsx',
        'src/app/(admin)/dashboard/@modal/default.tsx',
        'src/app/(admin)/dashboard/default.tsx',
        'src/app/(admin)/dashboard/template.js',
        'src/app/(admin)/dashboard/not-found.tsx',
        'src/app/(admin)/dashboard/page.jsx',
        'src/app/(marketing)/layout.tsx',
      ],
    )).toEqual([
      'src/app/layout.tsx',
      'src/app/(admin)/layout.ts',
      'src/app/(admin)/error.tsx',
      'src/app/(admin)/loading.tsx',
      'src/app/(admin)/@analytics/default.tsx',
      'src/app/(admin)/dashboard/template.js',
      'src/app/(admin)/dashboard/not-found.tsx',
      'src/app/(admin)/dashboard/default.tsx',
      'src/app/(admin)/dashboard/@modal/default.tsx',
      'src/app/(admin)/dashboard/page.jsx',
    ])
  })

  it('resolves Next App Router route entries with compound pageExtensions', () => {
    expect(getNextAppRouterRouteEntriesFromCandidates(
      'src/app/(admin)/dashboard/page.page.tsx',
      [
        'src/app/layout.tsx',
        'src/app/(admin)/layout.page.tsx',
        'src/app/(admin)/@analytics/default.page.tsx',
        'src/app/(admin)/dashboard/template.page.ts',
        'src/app/(admin)/dashboard/@modal/default.page.tsx',
        'src/app/(admin)/dashboard/page.page.tsx',
        'src/app/(marketing)/layout.page.tsx',
      ],
      { pageExtensions: ['tsx', 'page.tsx', 'page.ts'] },
    )).toEqual([
      'src/app/layout.tsx',
      'src/app/(admin)/layout.page.tsx',
      'src/app/(admin)/@analytics/default.page.tsx',
      'src/app/(admin)/dashboard/template.page.ts',
      'src/app/(admin)/dashboard/@modal/default.page.tsx',
      'src/app/(admin)/dashboard/page.page.tsx',
    ])
  })

  it('normalizes App Router route groups, slots, and interception markers to public routes', () => {
    expect(resolveNextAppRouterPageRoute('src/app/(admin)/dashboard/page.tsx')).toBe('/dashboard')
    expect(resolveNextAppRouterPageRoute('src/app/dashboard/@analytics/page.tsx')).toBe('/dashboard')
    expect(resolveNextAppRouterPageRoute('src/app/dashboard/@modal/(.)reports/page.tsx'))
      .toBe('/dashboard/reports')
    expect(resolveNextAppRouterPageRoute('src/app/dashboard/@modal/(..)reports/page.tsx'))
      .toBe('/dashboard/reports')
    expect(resolveNextAppRouterPageRoute('src/app/dashboard/@modal/(...)reports/page.tsx'))
      .toBe('/dashboard/reports')
  })

  it('requires page route aliases before resolving Next App Router page CSS', () => {
    const manifest = {
      version: 1,
      mode: 'page',
      global: [],
      pages: {
        'src/app/dashboard/layout.tsx': [
          {
            file: 'iconcat.dashboard-layout.css',
            href: '/assets/iconcat.dashboard-layout.css',
          },
        ],
        'src/app/dashboard/settings/template.tsx': [
          {
            file: 'iconcat.settings-template.css',
            href: '/assets/iconcat.settings-template.css',
            priority: true,
          },
        ],
        'src/app/dashboard/settings/page.tsx': [
          {
            file: 'iconcat.settings-page.css',
            href: '/assets/iconcat.settings-page.css',
          },
        ],
      },
    } satisfies IconcatCSSManifest

    expect(() => getNextAppRouterPageManifestEntries(
      manifest,
      // @ts-expect-error App Router page helpers only accept route paths.
      'src/app/dashboard/settings/page.tsx',
    )).toThrow('only accept route paths')
    expect(() => getIconcatNextAppRouterPageCSSHrefsFromManifest(
      manifest,
      // @ts-expect-error App Router page helpers only accept route paths.
      'src/app/dashboard/settings/page.tsx',
    )).toThrow('only accept route paths')
  })

  it('deduplicates files from page manifests when emitting assets', () => {
    const manifest = {
      version: 1,
      mode: 'page',
      global: [
        {
          file: 'iconcat.shared.css',
          href: '/assets/iconcat.shared.css',
          priority: true,
        },
      ],
      pages: {
        'src/routes/a.tsx': [
          {
            file: 'iconcat.page.css',
            href: '/assets/iconcat.page.css',
          },
        ],
        'src/routes/b.tsx': [
          {
            file: 'iconcat.page.css',
            href: '/assets/iconcat.page.css',
          },
        ],
      },
    } satisfies IconcatCSSManifest

    expect(getIconcatManifestFiles(manifest)).toEqual([
      'iconcat.shared.css',
      'iconcat.page.css',
    ])
  })

  it('starts extraction in buildStart and waits before emitting CSS', async () => {
    const cwd = await createFixture()
    const release = deferred<void>()
    let artifactStarted = false

    const artifact: IconcatArtifact = {
      name: 'delayed-css',
      async write(result) {
        artifactStarted = true
        await release.promise
        await writeFile(resolve(result.cwd, '.iconcat/iconcat.test.css'), '.icon-test{}\n')
        await writeFile(
          resolve(result.cwd, '.iconcat/manifest.json'),
          `${JSON.stringify({
            version: 1,
            file: 'iconcat.test.css',
            href: '/assets/iconcat.test.css',
            hash: 'test',
            icons: 1,
          })}\n`,
        )
      },
    }

    const [plugin] = iconcat({
      cwd,
      entries: ['src/main.ts'],
      output: '.iconcat/catalog.json',
      artifacts: [artifact],
      manifest: '.iconcat/manifest.json',
      sourceDir: '.iconcat',
    })
    const emitted: Array<{ fileName?: string, source?: string, type: string }> = []
    const buildStart = getHook(plugin.buildStart)
    const generateBundle = getHook(plugin.generateBundle)
    const transformIndexHtml = getHook(plugin.transformIndexHtml)

    const buildStartResult = buildStart.call({} as never, {} as never)

    expect(buildStartResult).toBeUndefined()

    await waitFor(() => artifactStarted)

    const generated = generateBundle.call({
      emitFile(asset: { fileName?: string, source?: string, type: string }) {
        emitted.push(asset)
      },
    } as never, {} as never, {} as never, false as never)

    await Promise.resolve()
    expect(emitted).toEqual([])

    release.resolve()
    await generated

    expect(emitted).toEqual([
      {
        type: 'asset',
        fileName: 'assets/iconcat.test.css',
        source: '.icon-test{}\n',
      },
    ])

    await expect(transformIndexHtml.call({} as never, '<html></html>' as never, {} as never))
      .resolves
      .toEqual([
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: '/assets/iconcat.test.css',
          },
          injectTo: 'head',
        },
        {
          tag: 'script',
          children: 'window.__ICONCAT_CSS_HREF__="/assets/iconcat.test.css"',
          injectTo: 'head',
        },
      ])
  })

  it('emits and links every CSS file from global layer artifacts', async () => {
    const cwd = await createFixture()
    const artifact: IconcatArtifact = {
      name: 'global-css',
      async write(result) {
        await writeFile(resolve(result.cwd, '.iconcat/iconcat.a.css'), '.icon-a{}\n')
        await writeFile(resolve(result.cwd, '.iconcat/iconcat.b.css'), '.icon-b{}\n')
        await writeFile(
          resolve(result.cwd, '.iconcat/manifest.json'),
          `${JSON.stringify({
            version: 1,
            mode: 'global',
            files: {
              priority: {
                file: 'iconcat.a.css',
                href: '/assets/iconcat.a.css',
                icons: 1,
              },
              normal: {
                file: 'iconcat.b.css',
                href: '/assets/iconcat.b.css',
                icons: 1,
              },
            },
            icons: 2,
          })}\n`,
        )
      },
    }

    const [plugin] = iconcat({
      cwd,
      entries: ['src/main.ts'],
      output: '.iconcat/catalog.json',
      artifacts: [artifact],
      manifest: '.iconcat/manifest.json',
      sourceDir: '.iconcat',
    })
    const emitted: Array<{ fileName?: string, source?: string, type: string }> = []

    await runBuildStart(plugin)
    await runGenerateBundle(plugin, emitted)

    expect(emitted).toEqual([
      {
        type: 'asset',
        fileName: 'assets/iconcat.a.css',
        source: '.icon-a{}\n',
      },
      {
        type: 'asset',
        fileName: 'assets/iconcat.b.css',
        source: '.icon-b{}\n',
      },
    ])

    await expect(runTransformIndexHtml(plugin))
      .resolves
      .toEqual([
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: '/assets/iconcat.a.css',
          },
          injectTo: 'head',
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: '/assets/iconcat.b.css',
          },
          injectTo: 'head',
        },
        {
          tag: 'script',
          children: 'window.__ICONCAT_CSS_HREF__="/assets/iconcat.a.css"',
          injectTo: 'head',
        },
      ])
  })

  it('emits page manifest CSS files without globally linking page files', async () => {
    const cwd = await createFixture()
    const artifact: IconcatArtifact = {
      name: 'page-css',
      async write(result) {
        await writeFile(resolve(result.cwd, '.iconcat/iconcat.global.css'), '.icon-global{}\n')
        await writeFile(resolve(result.cwd, '.iconcat/iconcat.page.css'), '.icon-page{}\n')
        await writeFile(
          resolve(result.cwd, '.iconcat/manifest.json'),
          `${JSON.stringify({
            version: 1,
            mode: 'page',
            global: [
              {
                file: 'iconcat.global.css',
                href: '/assets/iconcat.global.css',
                icons: 1,
                priority: true,
              },
            ],
            pages: {
              'src/routes/dashboard.tsx': [
                {
                  file: 'iconcat.page.css',
                  href: '/assets/iconcat.page.css',
                  icons: 1,
                },
              ],
            },
            icons: 2,
          })}\n`,
        )
      },
    }

    const [plugin] = iconcat({
      cwd,
      entries: ['src/main.ts'],
      output: '.iconcat/catalog.json',
      artifacts: [artifact],
      manifest: '.iconcat/manifest.json',
      sourceDir: '.iconcat',
    })
    const emitted: Array<{ fileName?: string, source?: string, type: string }> = []

    await runBuildStart(plugin)
    await runGenerateBundle(plugin, emitted)

    expect(emitted).toEqual([
      {
        type: 'asset',
        fileName: 'assets/iconcat.global.css',
        source: '.icon-global{}\n',
      },
      {
        type: 'asset',
        fileName: 'assets/iconcat.page.css',
        source: '.icon-page{}\n',
      },
    ])

    await expect(runTransformIndexHtml(plugin))
      .resolves
      .toEqual([
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: '/assets/iconcat.global.css',
          },
          injectTo: 'head',
        },
        {
          tag: 'script',
          children: 'window.__ICONCAT_CSS_HREF__="/assets/iconcat.global.css"',
          injectTo: 'head',
        },
      ])
  })
})

function getHook<T extends (...args: never[]) => unknown>(
  hook: T | { handler?: T, transform?: T } | undefined,
) {
  if (!hook) {
    throw new Error('Expected Vite hook to be defined.')
  }
  if (typeof hook === 'function') {
    return hook
  }
  if (hook.handler) {
    return hook.handler
  }
  if (hook.transform) {
    return hook.transform
  }
  throw new Error('Expected Vite hook object to expose a handler.')
}

async function createFixture() {
  const cwd = resolve(tmpdir(), `iconcat-vite-test-${process.pid}-${Date.now()}`)
  roots.push(cwd)
  await mkdir(resolve(cwd, 'src'), { recursive: true })
  await writeFile(resolve(cwd, 'src/main.ts'), 'export const icon = "mdi-light:home"\n')
  await writeFile(resolve(cwd, 'package.json'), '{"type":"module","private":true}\n')
  return cwd
}

function runBuildStart(plugin: ReturnType<typeof iconcat>[number]) {
  const buildStart = getHook(plugin.buildStart)
  return buildStart.call({} as never, {} as never)
}

function runGenerateBundle(
  plugin: ReturnType<typeof iconcat>[number],
  emitted: Array<{ fileName?: string, source?: string, type: string }>,
) {
  const generateBundle = getHook(plugin.generateBundle)
  return generateBundle.call({
    emitFile(asset: { fileName?: string, source?: string, type: string }) {
      emitted.push(asset)
    },
  } as never, {} as never, {} as never, false as never)
}

function runTransformIndexHtml(plugin: ReturnType<typeof iconcat>[number]) {
  const transformIndexHtml = getHook(plugin.transformIndexHtml)
  return transformIndexHtml.call({} as never, '<html></html>' as never, {} as never)
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

async function waitFor(callback: () => boolean) {
  for (let index = 0; index < 50; index += 1) {
    if (callback()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  throw new Error('Timed out while waiting for condition.')
}
