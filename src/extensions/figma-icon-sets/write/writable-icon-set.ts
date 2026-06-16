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

  // `loadIconifyJsonPath` returns null both when the local file is missing and
  // when it exists but fails to load. In incremental-update mode the latter must
  // not be treated as a fresh initialization: writing the imported set directly
  // would overwrite the existing file and drop any icons it still contains.
  // Only a genuinely missing local file may initialize; otherwise fail loudly.
  if (
    mode === 'incremental-update'
    && !prevIconSet
    && fse.existsSync(targetIconsJsonPath)
  ) {
    throw new Error(
      `Local icon set "${targetIconsJsonPath}" exists but could not be loaded. `
      + `Refusing to overwrite it in incremental-update mode to avoid losing icons. `
      + `Fix or remove the file, or use full-update mode.`,
    )
  }

  const addedIconNames: string[] = []
  const updatedIconNames: string[] = []
  iconSet.forEach((name) => {
    if (!prevIconSet?.exists(name)) {
      addedIconNames.push(name)
    } else if (isIconContentChanged(prevIconSet, iconSet, name)) {
      // Icon exists in both sets but its resolved content differs.
      updatedIconNames.push(name)
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
    updatedIconNames,
    removedIconNames,
    targetIconsJsonDir,
    targetIconsJsonPath,
  }
}

/**
 * Whether an icon present in both sets changed its resolved content (body /
 * dimensions). Both sets go through the same optimize pipeline, so a stable
 * source resolves identically and only real edits are reported.
 */
function isIconContentChanged(
  prevIconSet: IconSet,
  nextIconSet: IconSet,
  name: string,
) {
  const prevResolved = prevIconSet.resolve(name, true)
  const nextResolved = nextIconSet.resolve(name, true)
  return JSON.stringify(prevResolved) !== JSON.stringify(nextResolved)
}
