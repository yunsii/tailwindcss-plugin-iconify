import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { resolve } from 'pathe'
import { afterEach, describe, expect, it } from 'vitest'

import type { IconcatArtifact } from '@iconcat/extractor'

import { iconcat } from '../src'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })))
  roots.length = 0
})

describe('iconcat vite plugin', () => {
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
