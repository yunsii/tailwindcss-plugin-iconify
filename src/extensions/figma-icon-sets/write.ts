import fse from 'fs-extra'
import pathe from 'pathe'
import consola from 'consola'
import { mergeIconSets } from '@iconify/tools'

import type { IconSet } from '@iconify/tools'

import { loadIconifyJsonPath } from '@/helpers/icon-set'

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

  for (const iconSet of iconSets) {
    const composedOutputDir = pathe.normalize(
      pathe.join(outputDir, iconSet.prefix),
    )
    fse.ensureDirSync(composedOutputDir)

    const targetIconsJsonPath = pathe.join(composedOutputDir, `icons.json`)

    const prevIconSet = loadIconifyJsonPath(targetIconsJsonPath)

    const prevIconNames: string[] = []
    prevIconSet?.forEach((name) => {
      prevIconNames.push(name)
    })

    const addedIconNames: string[] = []
    iconSet.forEach((name) => {
      if (!prevIconNames.includes(name)) {
        addedIconNames.push(name)
      }
    })

    const removedIconNames: string[] = []
    prevIconNames.forEach((name) => {
      if (!iconSet.exists(name)) {
        removedIconNames.push(name)
      }
    })

    const logPrefix = `[write-icon-set][${iconSet.prefix}]`

    const writeIconSet: IconSet =
      mode === 'override' && prevIconSet
        ? mergeIconSets(prevIconSet, iconSet)
        : iconSet

    if (!prevIconNames) {
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
        (mode === 'overwrite' &&
          !addedIconNames.length &&
          !removedIconNames.length) ||
        (mode === 'override' && !addedIconNames.length)
      ) {
        consola.log(`${logPrefix} No icons changed`)
        continue
      }
    }

    fse.writeJsonSync(targetIconsJsonPath, writeIconSet.export())
    fse.writeFileSync(
      pathe.join(composedOutputDir, `icons.html`),
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
    .list()
    .map((item) => {
      const svgStr = writeIconSet.toSVG(item)?.toString()
      return `<span title="${item}">${svgStr}</span>`
    })
    .join('')}
</body>
</html>
`,
    )
  }
}
