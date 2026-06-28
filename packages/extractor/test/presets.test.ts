import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { nextApp, nextPages, reactRouter } from '@iconcat/presets'
import { resolve } from 'pathe'
import { afterEach, describe, expect, it } from 'vitest'

import { extractIconCatalog } from '../src'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })))
  roots.length = 0
})

describe('framework presets', () => {
  it('supports Next.js App Router entries', async () => {
    const result = await extractIconCatalog({
      cwd: resolve(__dirname, 'fixtures/next-app'),
      presets: [nextApp()],
    })

    expect(result.catalog.icons).toEqual({
      'line-md': ['home'],
      'mdi-light': ['home', 'view-dashboard'],
    })
  })

  it('supports Next.js Pages Router entries and ignores api routes', async () => {
    const result = await extractIconCatalog({
      cwd: resolve(__dirname, 'fixtures/next-pages'),
      presets: [nextPages()],
    })

    expect(result.catalog.icons).toEqual({
      'line-md': ['home'],
      'mdi-light': ['home'],
    })
  })

  it('supports compound Next.js pageExtensions in App Router presets', async () => {
    const cwd = await createFixture('next-app-page-extension')
    await writeFixtureFile(cwd, 'src/app/layout.page.tsx', [
      'export function LayoutIcon() {',
      '  return <span className="icon-[mdi-light--home]" />',
      '}',
      'export default function Layout({ children }: { children: React.ReactNode }) { return children }',
    ].join('\n'))
    await writeFixtureFile(cwd, 'src/app/dashboard/page.page.tsx', [
      'export default function Dashboard() {',
      '  return <span className="icon-[mdi-light--view-dashboard]" />',
      '}',
    ].join('\n'))

    const result = await extractIconCatalog({
      cwd,
      presets: [nextApp({ pageExtensions: ['page.tsx'] })],
    })

    expect(result.graph.entries.map((entry) => entry.name)).toEqual([
      'src/app/dashboard/page.page.tsx',
      'src/app/layout.page.tsx',
    ])
    expect(result.catalog.icons).toEqual({
      'mdi-light': ['home', 'view-dashboard'],
    })
  })

  it('supports compound Next.js pageExtensions in Pages Router presets', async () => {
    const cwd = await createFixture('next-pages-page-extension')
    await writeFixtureFile(cwd, 'src/pages/index.page.tsx', [
      'export default function Home() {',
      '  return <span className="icon-[mdi-light--home]" />',
      '}',
    ].join('\n'))
    await writeFixtureFile(cwd, 'src/pages/api/health.page.tsx', [
      'export default function handler() {',
      '  return "icon-[mdi-light--alert-circle]"',
      '}',
    ].join('\n'))

    const result = await extractIconCatalog({
      cwd,
      presets: [nextPages({ pageExtensions: ['page.tsx'] })],
    })

    expect(result.graph.entries.map((entry) => entry.name)).toEqual([
      'src/pages/index.page.tsx',
    ])
    expect(result.catalog.icons).toEqual({
      'mdi-light': ['home'],
    })
  })

  it('supports React Router style app entries', async () => {
    const result = await extractIconCatalog({
      cwd: resolve(__dirname, 'fixtures/react-router'),
      presets: [reactRouter()],
    })

    // The fixture imports the shared demo package. Keep this expectation wide
    // enough to prove entry-driven extraction follows the reachable dependency graph.
    expect(result.catalog.icons).toEqual({
      'line-md': ['loading-loop'],
      'mdi-light': ['cog', 'home', 'view-dashboard'],
    })
  })
})

async function createFixture(name: string) {
  const cwd = resolve(tmpdir(), `iconcat-${name}-${process.pid}-${Date.now()}`)
  roots.push(cwd)
  await rm(cwd, { recursive: true, force: true })
  await mkdir(cwd, { recursive: true })
  return cwd
}

async function writeFixtureFile(cwd: string, file: string, content: string) {
  const target = resolve(cwd, file)
  await mkdir(resolve(target, '..'), { recursive: true })
  await writeFile(target, `${content}\n`)
}
