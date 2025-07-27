import type { IconSet } from '@iconify/tools'

import { calcWritableIconSet } from './writable-icon-set'
import { writeIconSet } from './write-icon-set'

import type { CalcWritableIconSetBaseOptions } from './writable-icon-set'

export interface WriteIconifyJSONsOptions extends CalcWritableIconSetBaseOptions {
  afterWrite?: (iconSets: IconSet[]) => void
}

export function writeIconifyJSONs(
  iconSets: IconSet[],
  options: WriteIconifyJSONsOptions,
) {
  const { mode = 'incremental-update', outputDir, afterWrite } = options

  const writableIconSets = iconSets.map((iconSet) => {
    return calcWritableIconSet({ iconSet, outputDir, mode })
  })

  for (const writableIconSetData of writableIconSets) {
    const hasChanges = writeIconSet({
      ...writableIconSetData,
      mode,
    })

    if (!hasChanges) {
      continue
    }
  }

  afterWrite?.(writableIconSets.map((item) => item.writeIconSet))
}
