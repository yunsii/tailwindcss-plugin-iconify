/* eslint-disable no-console */
import pathe from 'pathe'
import { expect, it } from 'vitest'

import {
  importFigmaIconSets,
  writeIconifyJSONs,
} from '../src/extensions/figma-icon-sets/node'

it(
  'Basic',
  async () => {
    const iconSets = await importFigmaIconSets({
      // ref: https://www.figma.com/file/PMVacJLndw38SM0MNyRXTy/Untitled?type=design&node-id=0%3A1&mode=design&t=iCPCkoSBt6QNqlOk-1
      fileIds: ['PMVacJLndw38SM0MNyRXTy'],
      token: process.env.VITE_FIGMA_TOKEN!,
      prefix: 'test',
      preserveColorsGroup: 'test-colored',
      cache: true,
    })
    iconSets.forEach((iconSet) => {
      console.log('Found', iconSet.prefix, iconSet.count(), 'icons')
    })

    writeIconifyJSONs(
      iconSets.map((item) => {
        item.lastModified = 0
        return item
      }),
      {
        outputDir: pathe.join(__dirname, '__snapshots__', 'figma'),
      },
    )

    iconSets.forEach((iconSet) => {
      const iconifyJSON = iconSet.export()
      iconifyJSON.lastModified = 0
      expect(iconifyJSON).toMatchSnapshot()
    })
  },
  {
    timeout: 10e3,
  },
)
