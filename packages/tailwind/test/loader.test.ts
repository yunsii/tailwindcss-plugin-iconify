import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { locateIconSet } from '../src/loader'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('testing icon set loader', () => {
  it('resolves icon sets from caller cwd node_modules', async () => {
    const fixtureRoot = await mkdtemp(resolve(tmpdir(), 'iconcat-loader-'))
    const scopedDirectory = resolve(fixtureRoot, 'node_modules/@iconify-json')
    const iconSetDirectory = resolve(scopedDirectory, 'caller-test')

    await mkdir(iconSetDirectory, { recursive: true })
    await writeFile(resolve(iconSetDirectory, 'icons.json'), '{"prefix":"caller-test","icons":{}}\n')
    await writeFile(resolve(iconSetDirectory, 'info.json'), '{"name":"Caller Test"}\n')

    expect(locateIconSet('caller-test', fixtureRoot)?.main).toBe(
      resolve(iconSetDirectory, 'icons.json'),
    )
  })
})
