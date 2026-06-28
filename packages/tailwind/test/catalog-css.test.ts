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
})
