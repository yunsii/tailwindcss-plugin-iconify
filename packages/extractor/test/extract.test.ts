import { resolve } from 'pathe'
import { describe, expect, it } from 'vitest'

import { extractIconCatalog } from '../src'

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
})
