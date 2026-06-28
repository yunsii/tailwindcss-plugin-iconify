import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

import {
  describe,
  expect,
  it,
} from 'vitest'

import { collectProductionPreviewSnapshots } from '../scripts/verify-production-previews.mjs'

const root = process.cwd()
const snapshotFile = resolve(root, 'scripts/production-preview.snapshots.json')

describe('production previews', () => {
  it('matches router CSS injection snapshots', async () => {
    const actual = await collectProductionPreviewSnapshots({ root })
    const expected = JSON.parse(await readFile(snapshotFile, 'utf8'))

    try {
      expect(actual).toEqual(expected)
    } catch (error) {
      const actualFile = resolve(root, 'scripts/production-preview.actual.json')
      await writeFile(actualFile, `${JSON.stringify(actual, null, 2)}\n`)
      throw error
    }
  }, 60000)
})
