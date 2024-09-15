import { loadIconifyJsonPath } from '@/helpers/icon-set'
import { mergeIconSets } from '@iconify/tools'
import consola from 'consola'
import fse from 'fs-extra'
import pathe from 'pathe'

import type { IconSet } from '@iconify/tools'

export interface WriteIconifyJSONsOptions {
  outputDir: string
  /**
   * write mode, default 'overwrite'
   *
   * - overwrite, write icon sets directly
   * - override, merge new icon sets to local icon sets
   */
  mode?: 'overwrite' | 'override'
}

export function writeIconifyJSONs(
  iconSets: IconSet[],
  options: WriteIconifyJSONsOptions,
) {
  const { mode, outputDir } = options

  function getTargetIconsJsonPath(iconSet: IconSet) {
    const composedOutputDir = pathe.normalize(
      pathe.join(outputDir, iconSet.prefix),
    )
    fse.ensureDirSync(composedOutputDir)

    const targetIconsJsonPath = pathe.join(composedOutputDir, `icons.json`)
    return { targetIconsJsonPath, targetIconsJsonDir: composedOutputDir }
  }

  const writableIconSets = iconSets.map((iconSet) => {
    const { targetIconsJsonPath, targetIconsJsonDir } = getTargetIconsJsonPath(iconSet)
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
  })

  for (const { prevIconSet, writeIconSet, addedIconNames, removedIconNames, targetIconsJsonDir, targetIconsJsonPath } of writableIconSets) {
    const logPrefix = `[write-icon-set][${writeIconSet.prefix}]`

    if (!prevIconSet) {
      consola.success(
        `${logPrefix} Initialize with ${writeIconSet.count()} icons`,
      )
    } else {
      if (addedIconNames.length) {
        consola.success(
          `${logPrefix} Added icons:\n${addedIconNames.join('\n')}`,
        )
      }
      if (mode === 'overwrite' && removedIconNames.length) {
        consola.warn(
          `${logPrefix} Removed icons:\n${removedIconNames.join('\n')}`,
        )
      }
      if (
        (mode === 'overwrite'
          && !addedIconNames.length
          && !removedIconNames.length)
          || (mode === 'override' && !addedIconNames.length)
      ) {
        consola.log(`${logPrefix} No icons changed`)
        continue
      }
    }

    fse.writeJsonSync(targetIconsJsonPath, writeIconSet.export(), {
      spaces: 2,
    })
    fse.writeFileSync(
      pathe.join(targetIconsJsonDir, `icons.html`),
      `
        <html>
        <style>
        svg {
          width: 32px;
          height: 32px;
        }

        svg:hover {
          background: #ddd;
          color: gray;
        }
        </style>
        <body>
          ${writeIconSet
              .list(['icon', 'variation', 'alias'])
              .map((item) => {
                const svgStr = writeIconSet.toSVG(item)?.toString()
                return `<span title="${item}">${svgStr}</span>`
              })
              .join('\n  ')}
        </body>
        </html>
      `,
    )
  }
}
