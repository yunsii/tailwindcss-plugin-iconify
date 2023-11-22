import pathe from 'pathe'
import { expect, it } from 'vitest'
import consola from 'consola'

import {
  importFigmaIconSets,
  writeIconifyJSONs,
} from '../src/extensions/figma-icon-sets/node'

it(
  'Basic',
  async () => {
    const iconSets = await importFigmaIconSets({
      files: [
        {
          // ref: https://www.figma.com/file/PMVacJLndw38SM0MNyRXTy/Untitled?type=design&node-id=0%3A1&mode=design&t=iCPCkoSBt6QNqlOk-1
          id: 'PMVacJLndw38SM0MNyRXTy',
          nodeIds: ['0-1', '113-3'],
          prefix: 'test',
        },
        {
          // ref: https://www.figma.com/file/PMVacJLndw38SM0MNyRXTy/Untitled?type=design&node-id=116-4&mode=design&t=Oda5b2fjO9W4y2vX-0
          id: 'PMVacJLndw38SM0MNyRXTy',
          nodeIds: ['116-4'],
          prefix: 'common',
        },
      ],
      token: process.env.VITE_FIGMA_TOKEN!,
      preserveColorsGroup: 'test-colored',
      cache: true,
    })

    iconSets.forEach((iconSet) => {
      consola.log('Found', iconSet.prefix, iconSet.count(), 'icons')
    })

    writeIconifyJSONs(
      iconSets.map((item) => {
        item.lastModified = 0
        return item
      }),
      {
        outputDir: pathe.join(__dirname, '__output__', 'figma'),
      },
    )

    iconSets.forEach((iconSet) => {
      const iconifyJSON = iconSet.export()
      iconifyJSON.lastModified = 0
      const snapshotFile = pathe.join(
        __dirname,
        '__output__',
        `icons-${iconSet.prefix}.txt`,
      )
      expect(iconifyJSON).toMatchFileSnapshot(snapshotFile)
    })
  },
  {
    timeout: 10e3,
  },
)
