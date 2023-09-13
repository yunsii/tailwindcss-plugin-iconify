/* eslint-disable no-console */
import { expect, it } from 'vitest'
import pathe from 'pathe'

import { loadFigmaIconSet } from '../src/extensions/figma-icon-sets/load'
import { writeIconifyJSON } from '../src/extensions/figma-icon-sets/write'

it(
  'Basic',
  async () => {
    const iconSet = await loadFigmaIconSet({
      // ref: https://www.figma.com/file/PMVacJLndw38SM0MNyRXTy/Untitled?type=design&node-id=0%3A1&mode=design&t=iCPCkoSBt6QNqlOk-1
      fileId: 'PMVacJLndw38SM0MNyRXTy',
      token: process.env.VITE_FIGMA_TOKEN!,
      prefix: 'test',
      preserveColorsGroup: 'test-colored',
    })
    console.log('Found', iconSet.count(), 'icons')

    writeIconifyJSON(iconSet, {
      outputDir: pathe.join(__dirname, '__snapshots__', 'figma'),
    })

    const iconifyJSON = iconSet.export()
    iconifyJSON.lastModified = 0
    expect(iconifyJSON).toMatchSnapshot()
  },
  {
    timeout: 10e3,
  },
)
