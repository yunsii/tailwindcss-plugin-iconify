import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)

const examples = {
  nextAppRouter: {
    cwd: new URL('../examples/next-app-router/', import.meta.url),
    filter: '@iconcat/example-next-app-router',
    page: 'src/app/dashboard/page.tsx',
    nestedLayout: 'src/app/dashboard/reports/layout.tsx',
    nestedPage: 'src/app/dashboard/reports/page.tsx',
  },
  nextPagesRouter: {
    cwd: new URL('../examples/next-pages-router/', import.meta.url),
    filter: '@iconcat/example-next-pages-router',
    page: 'src/pages/dashboard/index.tsx',
    serverPage: 'src/pages/settings/index.tsx',
  },
  reactRouterVite: {
    cwd: new URL('../examples/react-router-vite/', import.meta.url),
    filter: '@iconcat/example-react-router-vite',
    page: 'src/App.tsx',
  },
}

describe('example page-mode extraction', () => {
  it('extracts Next App Router global and page scoped CSS', async () => {
    const manifest = await extractPageMode(examples.nextAppRouter.filter, examples.nextAppRouter.cwd)
    const globalCSS = await readCSS(examples.nextAppRouter.cwd, manifest.global[0].file)
    const pageCSS = await readCSS(
      examples.nextAppRouter.cwd,
      manifest.pages[examples.nextAppRouter.page][0].file,
    )

    expect(manifest.mode).toBe('page')
    expect(manifest.global).toEqual([
      expect.objectContaining({
        file: expect.stringMatching(/^iconcat\.[a-f0-9]{10}\.css$/),
        href: expect.stringMatching(/^\/_next\/static\/css\/iconcat\.[a-f0-9]{10}\.css$/),
        icons: 1,
        priority: true,
      }),
    ])
    expect(Object.keys(manifest.pages)).toContain(examples.nextAppRouter.page)
    expect(Object.keys(manifest.pages)).toContain(examples.nextAppRouter.nestedLayout)
    expect(Object.keys(manifest.pages)).toContain(examples.nextAppRouter.nestedPage)
    expect(manifest.pageRoutes).toEqual(expect.objectContaining({
      '/': 'src/app/page.tsx',
      '/dashboard': examples.nextAppRouter.page,
      '/dashboard/reports': examples.nextAppRouter.nestedPage,
    }))
    expect(manifest.routes[examples.nextAppRouter.nestedPage]).toEqual([
      'src/app/layout.tsx',
      examples.nextAppRouter.nestedLayout,
      examples.nextAppRouter.nestedPage,
    ])
    expect(globalCSS).toContain('.icon-\\[mdi-light--home\\]')
    expect(pageCSS).not.toContain('.icon-\\[mdi-light--home\\]')
    expect(pageCSS).toContain('.icon-\\[mdi-light--chart-line\\]')
    expect(pageCSS).toContain('.icon-\\[mdi-light--calendar\\]')
    expect(pageCSS).toContain('.icon-\\[mdi-light--view-dashboard\\]')

    const nestedLayoutCSS = await readCSS(
      examples.nextAppRouter.cwd,
      manifest.pages[examples.nextAppRouter.nestedLayout][0].file,
    )

    expect(nestedLayoutCSS).toContain('.icon-\\[mdi-light--folder\\]')
  })

  it('extracts Next Pages Router global and page scoped CSS', async () => {
    const manifest = await extractPageMode(examples.nextPagesRouter.filter, examples.nextPagesRouter.cwd)
    const globalCSS = await readCSS(examples.nextPagesRouter.cwd, manifest.global[0].file)
    const pageCSS = await readCSS(
      examples.nextPagesRouter.cwd,
      manifest.pages[examples.nextPagesRouter.page][0].file,
    )

    expect(manifest.mode).toBe('page')
    expect(manifest.global).toEqual([
      expect.objectContaining({
        file: expect.stringMatching(/^iconcat\.[a-f0-9]{10}\.css$/),
        href: expect.stringMatching(/^\/_next\/static\/css\/iconcat\.[a-f0-9]{10}\.css$/),
        icons: 1,
        priority: true,
      }),
    ])
    expect(Object.keys(manifest.pages)).toContain(examples.nextPagesRouter.page)
    expect(Object.keys(manifest.pages)).toContain(examples.nextPagesRouter.serverPage)
    expect(manifest.pageRoutes).toEqual(expect.objectContaining({
      '/': 'src/pages/index.tsx',
      '/dashboard': examples.nextPagesRouter.page,
      '/settings': examples.nextPagesRouter.serverPage,
    }))
    expect(globalCSS).toContain('.icon-\\[mdi-light--home\\]')
    expect(pageCSS).not.toContain('.icon-\\[mdi-light--home\\]')
    expect(pageCSS).toContain('.icon-\\[mdi-light--chart-line\\]')
    expect(pageCSS).toContain('.icon-\\[mdi-light--calendar\\]')
    expect(pageCSS).toContain('.icon-\\[mdi-light--view-dashboard\\]')

    const serverPageCSS = await readCSS(
      examples.nextPagesRouter.cwd,
      manifest.pages[examples.nextPagesRouter.serverPage][0].file,
    )

    expect(serverPageCSS).not.toContain('.icon-\\[mdi-light--home\\]')
    expect(serverPageCSS).toContain('.icon-\\[mdi-light--cog\\]')
  })

  it('extracts React Router Vite page-mode CSS files', async () => {
    const manifest = await extractPageMode(examples.reactRouterVite.filter, examples.reactRouterVite.cwd)
    const [appFile] = manifest.global

    expect(manifest.mode).toBe('page')
    expect(manifest.global).toEqual([
      expect.objectContaining({
        file: expect.stringMatching(/^iconcat\.[a-f0-9]{10}\.css$/),
        href: expect.stringMatching(/^\/assets\/iconcat\.[a-f0-9]{10}\.css$/),
      }),
    ])

    const appCSS = await readCSS(examples.reactRouterVite.cwd, appFile.file)

    expect(appCSS).toContain('.icon-\\[mdi-light--home\\]')
    expect(appCSS).toContain('.icon-\\[mdi-light--chart-line\\]')
    expect(appCSS).toContain('.icon-\\[mdi-light--calendar\\]')
    expect(appCSS).toContain('.icon-\\[mdi-light--view-dashboard\\]')
  })
})

async function extractPageMode(filter, cwd) {
  await execFileAsync('pnpm', ['--filter', filter, 'run', 'extract'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      ICONCAT_MODE: 'page',
    },
    timeout: 60000,
  })

  return JSON.parse(
    await readFile(new URL('.iconcat/page-mode/manifest.json', cwd), 'utf8'),
  )
}

async function readCSS(cwd, file) {
  return readFile(new URL(`.iconcat/page-mode/${file}`, cwd), 'utf8')
}
