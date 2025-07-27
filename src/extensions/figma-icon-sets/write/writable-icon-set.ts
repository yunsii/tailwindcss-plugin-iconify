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
   * write mode, default 'incremental-update'
   *
   * - full-update, write icon sets directly (overwrite all icons)
   * - incremental-update, merge new icon sets to local icon sets (no deletion allowed)
   */
  mode?: 'full-update' | 'incremental-update'
}

export interface CalcWritableIconSetOptions extends CalcWritableIconSetBaseOptions {
  iconSet: IconSet
}

export function calcWritableIconSet(
  options: CalcWritableIconSetOptions,
) {
  const { iconSet, outputDir, mode = 'incremental-update' } = options
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

  // In incremental-update mode, throw error if there are icons to be removed
  if (mode === 'incremental-update' && removedIconNames.length > 0) {
    throw new Error(
      `Cannot remove icons in incremental-update mode. Icons to be removed: ${removedIconNames.join(', ')}. Use full-update mode if you want to remove icons.`,
    )
  }

  const writeIconSet: IconSet
    = mode === 'incremental-update' && prevIconSet
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
