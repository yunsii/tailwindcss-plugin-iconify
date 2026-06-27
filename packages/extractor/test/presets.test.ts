import { nextApp, nextPages, reactRouter } from '@iconcat/presets'
import { resolve } from 'pathe'
import { describe, expect, it } from 'vitest'

import { extractIconCatalog } from '../src'

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

  it('supports React Router style app entries', async () => {
    const result = await extractIconCatalog({
      cwd: resolve(__dirname, 'fixtures/react-router'),
      presets: [reactRouter()],
    })

    expect(result.catalog.icons).toEqual({
      'line-md': ['loading-loop'],
    })
  })
})
