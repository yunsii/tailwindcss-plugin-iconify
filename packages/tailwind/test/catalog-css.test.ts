import { readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { resolve } from 'pathe'
import { describe, expect, it, vi } from 'vitest'

import { createIconcatCSSArtifact } from '../src/catalog-css'
import { catalogIcons } from '../src/plugin'

interface TestGlobalManifest {
  files: {
    normal?: TestGlobalManifestFile
    priority?: TestGlobalManifestFile
  }
  mode?: string
}

interface TestGlobalManifestFile {
  file: string
  hash: string
  icons?: number
  priority?: boolean
}

describe('testing catalog plugin options', () => {
  it('passes catalog icons to Tailwind matchComponents values', () => {
    const plugin = catalogIcons({
      version: 1,
      icons: {
        'mdi-light': ['home'],
      },
    })
    const matchComponents = vi.fn()

    plugin.handler({ matchComponents } as never)

    expect(matchComponents).toHaveBeenCalledWith(
      {
        icon: expect.any(Function),
      },
      {
        values: {
          'mdi-light--home': expect.objectContaining({
            '--svg': expect.any(String),
          }),
        },
      },
    )
    const [components] = matchComponents.mock.calls[0]!
    expect(components.icon('mdi-light--home')).toEqual(
      expect.objectContaining({
        '--svg': expect.stringContaining('data:image/svg+xml'),
      }),
    )
  })

  it('writes global CSS artifacts split by priority and normal layers', async () => {
    const cwd = resolve(tmpdir(), `iconcat-global-css-${process.pid}`)
    await rm(cwd, { recursive: true, force: true })

    await createIconcatCSSArtifact({
      artifactMode: 'global',
      output: '.iconcat/iconcat.[hash].css',
      manifest: '.iconcat/manifest.json',
      publicPath: '/assets',
    }).write({
      cwd,
      catalog: {
        version: 1,
        icons: {
          'mdi-light': ['home', 'cog'],
        },
        entries: {
          'src/app/layout.tsx': {
            priority: true,
            icons: {
              'mdi-light': ['home'],
            },
          },
          'src/app/page.tsx': {
            icons: {
              'mdi-light': ['home'],
            },
          },
          'src/app/settings/page.tsx': {
            icons: {
              'mdi-light': ['cog'],
            },
          },
          'src/app/empty/page.tsx': {
            icons: {},
          },
        },
      },
    })

    const manifest = JSON.parse(
      await readFile(resolve(cwd, '.iconcat/manifest.json'), 'utf8'),
    ) as TestGlobalManifest
    const priorityFile = manifest.files.priority
    const normalFile = manifest.files.normal

    expect(manifest.mode).toBe('global')
    expect(priorityFile?.icons).toBe(1)
    expect(normalFile?.icons).toBe(1)
    expect(priorityFile?.file).toMatch(/^iconcat\.[a-f0-9]{10}\.css$/)
    expect(normalFile?.file).toMatch(/^iconcat\.[a-f0-9]{10}\.css$/)
    expect(priorityFile?.hash).not.toBe(normalFile?.hash)

    const priorityCSS = await readFile(resolve(cwd, '.iconcat', priorityFile!.file), 'utf8')
    const normalCSS = await readFile(resolve(cwd, '.iconcat', normalFile!.file), 'utf8')

    expect(priorityCSS).toContain('.icon-\\[mdi-light--home\\]')
    expect(normalCSS).not.toContain('.icon-\\[mdi-light--home\\]')
    expect(normalCSS).toContain('.icon-\\[mdi-light--cog\\]')
  })

  it('writes page CSS artifacts with global and page scoped styles', async () => {
    const cwd = resolve(tmpdir(), `iconcat-page-css-${process.pid}`)
    await rm(cwd, { recursive: true, force: true })

    await createIconcatCSSArtifact({
      artifactMode: 'page',
      output: '.iconcat/iconcat.[hash].css',
      manifest: '.iconcat/manifest.json',
      publicPath: '/assets',
    }).write({
      cwd,
      catalog: {
        version: 1,
        icons: {
          'mdi-light': ['home', 'cog', 'calendar'],
        },
        entries: {
          'src/app/layout.tsx': {
            scope: 'global',
            icons: {
              'mdi-light': ['home'],
            },
          },
          'src/app/page.tsx': {
            icons: {
              'mdi-light': ['home', 'cog'],
            },
          },
          'src/app/settings/page.tsx': {
            icons: {
              'mdi-light': ['calendar'],
            },
          },
        },
      },
    })

    const manifest = JSON.parse(
      await readFile(resolve(cwd, '.iconcat/manifest.json'), 'utf8'),
    ) as {
      global: TestGlobalManifestFile[]
      mode?: string
      pages: Record<string, TestGlobalManifestFile[]>
      routes?: Record<string, string[]>
    }
    const [globalFile] = manifest.global
    const [pageFile] = manifest.pages['src/app/page.tsx']
    const [settingsFile] = manifest.pages['src/app/settings/page.tsx']

    expect(manifest.mode).toBe('page')
    expect(manifest.routes).toEqual({
      'src/app/page.tsx': [
        'src/app/layout.tsx',
        'src/app/page.tsx',
      ],
      'src/app/settings/page.tsx': [
        'src/app/layout.tsx',
        'src/app/settings/page.tsx',
      ],
    })
    expect(globalFile).toEqual(expect.objectContaining({
      icons: 1,
      priority: true,
    }))
    expect(pageFile).toEqual(expect.objectContaining({
      icons: 1,
    }))
    expect(settingsFile).toEqual(expect.objectContaining({
      icons: 1,
    }))
    expect(globalFile.file).toMatch(/^iconcat\.[a-f0-9]{10}\.css$/)
    expect(pageFile.file).toMatch(/^iconcat\.[a-f0-9]{10}\.css$/)

    const globalCSS = await readFile(resolve(cwd, '.iconcat', globalFile.file), 'utf8')
    const pageCSS = await readFile(resolve(cwd, '.iconcat', pageFile.file), 'utf8')
    const settingsCSS = await readFile(resolve(cwd, '.iconcat', settingsFile.file), 'utf8')

    expect(globalCSS).toContain('.icon-\\[mdi-light--home\\]')
    expect(pageCSS).not.toContain('.icon-\\[mdi-light--home\\]')
    expect(pageCSS).toContain('.icon-\\[mdi-light--cog\\]')
    expect(settingsCSS).toContain('.icon-\\[mdi-light--calendar\\]')
  })

  it('auto-promotes common Next App Router layout entries to global page CSS', async () => {
    const cwd = resolve(tmpdir(), `iconcat-page-common-layout-css-${process.pid}`)
    await rm(cwd, { recursive: true, force: true })

    await createIconcatCSSArtifact({
      artifactMode: 'page',
      output: '.iconcat/iconcat.[hash].css',
      manifest: '.iconcat/manifest.json',
      publicPath: '/assets',
    }).write({
      cwd,
      catalog: {
        version: 1,
        icons: {
          'mdi-light': ['home', 'chart-line', 'calendar'],
        },
        entries: {
          'src/app/layout.tsx': {
            icons: {
              'mdi-light': ['home'],
            },
          },
          'src/app/page.tsx': {
            icons: {
              'mdi-light': ['home', 'chart-line'],
            },
          },
          'src/app/settings/page.tsx': {
            icons: {
              'mdi-light': ['home', 'calendar'],
            },
          },
        },
      },
    })

    const manifest = JSON.parse(
      await readFile(resolve(cwd, '.iconcat/manifest.json'), 'utf8'),
    ) as {
      global: TestGlobalManifestFile[]
      pages: Record<string, TestGlobalManifestFile[]>
    }
    const [globalFile] = manifest.global
    const [homeFile] = manifest.pages['src/app/page.tsx']
    const [settingsFile] = manifest.pages['src/app/settings/page.tsx']

    expect(globalFile).toEqual(expect.objectContaining({
      icons: 1,
      priority: true,
    }))
    expect(manifest.pages['src/app/layout.tsx']).toBeUndefined()

    const globalCSS = await readFile(resolve(cwd, '.iconcat', globalFile.file), 'utf8')
    const homeCSS = await readFile(resolve(cwd, '.iconcat', homeFile.file), 'utf8')
    const settingsCSS = await readFile(resolve(cwd, '.iconcat', settingsFile.file), 'utf8')

    expect(globalCSS).toContain('.icon-\\[mdi-light--home\\]')
    expect(homeCSS).not.toContain('.icon-\\[mdi-light--home\\]')
    expect(homeCSS).toContain('.icon-\\[mdi-light--chart-line\\]')
    expect(settingsCSS).not.toContain('.icon-\\[mdi-light--home\\]')
    expect(settingsCSS).toContain('.icon-\\[mdi-light--calendar\\]')
  })

  it('auto-promotes common Next App Router layout entries with compound pageExtensions', async () => {
    const cwd = resolve(tmpdir(), `iconcat-page-common-layout-page-extension-css-${process.pid}`)
    await rm(cwd, { recursive: true, force: true })

    await createIconcatCSSArtifact({
      artifactMode: 'page',
      output: '.iconcat/iconcat.[hash].css',
      manifest: '.iconcat/manifest.json',
      publicPath: '/assets',
    }).write({
      cwd,
      catalog: {
        version: 1,
        icons: {
          'mdi-light': ['home', 'chart-line', 'calendar'],
        },
        entries: {
          'src/app/layout.page.tsx': {
            icons: {
              'mdi-light': ['home'],
            },
          },
          'src/app/page.page.tsx': {
            icons: {
              'mdi-light': ['home', 'chart-line'],
            },
          },
          'src/app/settings/page.page.tsx': {
            icons: {
              'mdi-light': ['home', 'calendar'],
            },
          },
        },
      },
    })

    const manifest = JSON.parse(
      await readFile(resolve(cwd, '.iconcat/manifest.json'), 'utf8'),
    ) as {
      global: TestGlobalManifestFile[]
      pages: Record<string, TestGlobalManifestFile[]>
      routes?: Record<string, string[]>
    }
    const [globalFile] = manifest.global
    const [homeFile] = manifest.pages['src/app/page.page.tsx']
    const [settingsFile] = manifest.pages['src/app/settings/page.page.tsx']

    expect(manifest.routes).toEqual({
      'src/app/page.page.tsx': [
        'src/app/layout.page.tsx',
        'src/app/page.page.tsx',
      ],
      'src/app/settings/page.page.tsx': [
        'src/app/layout.page.tsx',
        'src/app/settings/page.page.tsx',
      ],
    })
    expect(globalFile).toEqual(expect.objectContaining({
      icons: 1,
      priority: true,
    }))
    expect(manifest.pages['src/app/layout.page.tsx']).toBeUndefined()

    const globalCSS = await readFile(resolve(cwd, '.iconcat', globalFile.file), 'utf8')
    const homeCSS = await readFile(resolve(cwd, '.iconcat', homeFile.file), 'utf8')
    const settingsCSS = await readFile(resolve(cwd, '.iconcat', settingsFile.file), 'utf8')

    expect(globalCSS).toContain('.icon-\\[mdi-light--home\\]')
    expect(homeCSS).not.toContain('.icon-\\[mdi-light--home\\]')
    expect(homeCSS).toContain('.icon-\\[mdi-light--chart-line\\]')
    expect(settingsCSS).not.toContain('.icon-\\[mdi-light--home\\]')
    expect(settingsCSS).toContain('.icon-\\[mdi-light--calendar\\]')
  })

  it('auto-promotes Next Pages Router _app entries to global page CSS', async () => {
    const cwd = resolve(tmpdir(), `iconcat-page-next-pages-app-css-${process.pid}`)
    await rm(cwd, { recursive: true, force: true })

    await createIconcatCSSArtifact({
      artifactMode: 'page',
      output: '.iconcat/iconcat.[hash].css',
      manifest: '.iconcat/manifest.json',
      publicPath: '/assets',
    }).write({
      cwd,
      catalog: {
        version: 1,
        icons: {
          'mdi-light': ['home', 'chart-line', 'calendar'],
        },
        entries: {
          'src/pages/_app.tsx': {
            icons: {
              'mdi-light': ['home'],
            },
          },
          'src/pages/index.tsx': {
            icons: {
              'mdi-light': ['home', 'chart-line'],
            },
          },
          'src/pages/settings/index.tsx': {
            icons: {
              'mdi-light': ['home', 'calendar'],
            },
          },
        },
      },
    })

    const manifest = JSON.parse(
      await readFile(resolve(cwd, '.iconcat/manifest.json'), 'utf8'),
    ) as {
      global: TestGlobalManifestFile[]
      pages: Record<string, TestGlobalManifestFile[]>
    }
    const [globalFile] = manifest.global
    const [homeFile] = manifest.pages['src/pages/index.tsx']
    const [settingsFile] = manifest.pages['src/pages/settings/index.tsx']

    expect(globalFile).toEqual(expect.objectContaining({
      icons: 1,
      priority: true,
    }))
    expect(manifest.pages['src/pages/_app.tsx']).toBeUndefined()

    const globalCSS = await readFile(resolve(cwd, '.iconcat', globalFile.file), 'utf8')
    const homeCSS = await readFile(resolve(cwd, '.iconcat', homeFile.file), 'utf8')
    const settingsCSS = await readFile(resolve(cwd, '.iconcat', settingsFile.file), 'utf8')

    expect(globalCSS).toContain('.icon-\\[mdi-light--home\\]')
    expect(homeCSS).not.toContain('.icon-\\[mdi-light--home\\]')
    expect(homeCSS).toContain('.icon-\\[mdi-light--chart-line\\]')
    expect(settingsCSS).not.toContain('.icon-\\[mdi-light--home\\]')
    expect(settingsCSS).toContain('.icon-\\[mdi-light--calendar\\]')
  })

  it('auto-promotes Next Pages Router _app entries with compound pageExtensions', async () => {
    const cwd = resolve(tmpdir(), `iconcat-page-next-pages-app-page-extension-css-${process.pid}`)
    await rm(cwd, { recursive: true, force: true })

    await createIconcatCSSArtifact({
      artifactMode: 'page',
      output: '.iconcat/iconcat.[hash].css',
      manifest: '.iconcat/manifest.json',
      publicPath: '/assets',
    }).write({
      cwd,
      catalog: {
        version: 1,
        icons: {
          'mdi-light': ['home', 'chart-line'],
        },
        entries: {
          'pages/_app.page.tsx': {
            icons: {
              'mdi-light': ['home'],
            },
          },
          'pages/index.page.tsx': {
            icons: {
              'mdi-light': ['home', 'chart-line'],
            },
          },
        },
      },
    })

    const manifest = JSON.parse(
      await readFile(resolve(cwd, '.iconcat/manifest.json'), 'utf8'),
    ) as {
      global: TestGlobalManifestFile[]
      pages: Record<string, TestGlobalManifestFile[]>
    }
    const [globalFile] = manifest.global
    const [homeFile] = manifest.pages['pages/index.page.tsx']

    expect(globalFile).toEqual(expect.objectContaining({
      icons: 1,
      priority: true,
    }))
    expect(manifest.pages['pages/_app.page.tsx']).toBeUndefined()

    const globalCSS = await readFile(resolve(cwd, '.iconcat', globalFile.file), 'utf8')
    const homeCSS = await readFile(resolve(cwd, '.iconcat', homeFile.file), 'utf8')

    expect(globalCSS).toContain('.icon-\\[mdi-light--home\\]')
    expect(homeCSS).not.toContain('.icon-\\[mdi-light--home\\]')
    expect(homeCSS).toContain('.icon-\\[mdi-light--chart-line\\]')
  })

  it('keeps non-common Next App Router layout entries page scoped', async () => {
    const cwd = resolve(tmpdir(), `iconcat-page-non-common-layout-css-${process.pid}`)
    await rm(cwd, { recursive: true, force: true })

    await createIconcatCSSArtifact({
      artifactMode: 'page',
      output: '.iconcat/iconcat.[hash].css',
      manifest: '.iconcat/manifest.json',
      publicPath: '/assets',
    }).write({
      cwd,
      catalog: {
        version: 1,
        icons: {
          'mdi-light': ['home', 'folder', 'chart-line', 'calendar'],
        },
        entries: {
          'src/app/layout.tsx': {
            icons: {
              'mdi-light': ['home'],
            },
          },
          'src/app/dashboard/layout.tsx': {
            icons: {
              'mdi-light': ['folder'],
            },
          },
          'src/app/dashboard/page.tsx': {
            icons: {
              'mdi-light': ['home', 'folder', 'chart-line'],
            },
          },
          'src/app/settings/page.tsx': {
            icons: {
              'mdi-light': ['home', 'calendar'],
            },
          },
        },
      },
    })

    const manifest = JSON.parse(
      await readFile(resolve(cwd, '.iconcat/manifest.json'), 'utf8'),
    ) as {
      global: TestGlobalManifestFile[]
      pages: Record<string, TestGlobalManifestFile[]>
    }
    const [globalFile] = manifest.global
    const [dashboardLayoutFile] = manifest.pages['src/app/dashboard/layout.tsx']
    const [dashboardFile] = manifest.pages['src/app/dashboard/page.tsx']

    const globalCSS = await readFile(resolve(cwd, '.iconcat', globalFile.file), 'utf8')
    const dashboardLayoutCSS = await readFile(resolve(cwd, '.iconcat', dashboardLayoutFile.file), 'utf8')
    const dashboardCSS = await readFile(resolve(cwd, '.iconcat', dashboardFile.file), 'utf8')

    expect(globalCSS).toContain('.icon-\\[mdi-light--home\\]')
    expect(dashboardLayoutCSS).toContain('.icon-\\[mdi-light--folder\\]')
    expect(dashboardCSS).not.toContain('.icon-\\[mdi-light--home\\]')
    expect(dashboardCSS).toContain('.icon-\\[mdi-light--chart-line\\]')
  })
})
