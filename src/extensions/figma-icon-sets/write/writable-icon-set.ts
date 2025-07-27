import { loadIconifyJsonPath } from '@/helpers/icon-set'
import { mergeIconSets } from '@iconify/tools'
import fse from 'fs-extra'
import pathe from 'pathe'

import type { IconSet } from '@iconify/tools'

export function getTargetIconsJsonPath(iconSet: IconSet, outputDir: string) {
  const composedOutputDir = pathe.normalize(
    pathe.join(outputDir, iconSet.prefix),
  )
  fse.ensureDirSync(composedOutputDir)

  const targetIconsJsonPath = pathe.join(composedOutputDir, `icons.json`)
  return { targetIconsJsonPath, targetIconsJsonDir: composedOutputDir }
}

export interface CalcWritableIconSetBaseOptions {
  outputDir: string
  /**
   * write mode, default 'overwrite'
   *
   * - overwrite, write icon sets directly
   * - override, merge new icon sets to local icon sets
   */
  mode?: 'overwrite' | 'override'
}

export interface CalcWritableIconSetOptions extends CalcWritableIconSetBaseOptions {
  iconSet: IconSet
}

export function calcWritableIconSet(
  options: CalcWritableIconSetOptions,
) {
  const { iconSet, outputDir, mode = 'overwrite' } = options
  const { targetIconsJsonPath, targetIconsJsonDir } = getTargetIconsJsonPath(iconSet, outputDir)
  const prevIconSet = loadIconifyJsonPath(targetIconsJsonPath)

  const addedIconNames: string[] = []
  iconSet.forEach((name) => {
    if (!prevIconSet?.exists(name)) {
      addedIconNames.push(name)
    }
  })

  const removedIconNames: string[] = []
  prevIconSet?.forEach((name) => {
    if (!iconSet.exists(name)) {
      removedIconNames.push(name)
    }
  })

  const writeIconSet: IconSet
    = mode === 'override' && prevIconSet
      ? mergeIconSets(prevIconSet, iconSet)
      : iconSet

  return {
    prevIconSet,
    writeIconSet,
    addedIconNames,
    removedIconNames,
    targetIconsJsonDir,
    targetIconsJsonPath,
  }
}
