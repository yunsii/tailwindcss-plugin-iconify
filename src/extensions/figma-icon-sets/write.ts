import fse from 'fs-extra'
import pathe from 'pathe'
import consola from 'consola'

import type { IconSet } from '@iconify/tools'

import { loadIconifyJsonPath } from '@/helpers/icon-set'

export interface WriteIconifyJSONsOptions {
  outputDir: string
}

export function writeIconifyJSONs(
  iconSets: IconSet[],
  options: WriteIconifyJSONsOptions,
) {
  const { outputDir } = options

  for (const iconSet of iconSets) {
    const composedOutputDir = pathe.normalize(
      pathe.join(outputDir, iconSet.prefix),
    )
    fse.ensureDirSync(composedOutputDir)

    const targetIconsJsonPath = pathe.join(composedOutputDir, `icons.json`)

    const prevIconSet = loadIconifyJsonPath(targetIconsJsonPath)

    const prevIconNames: string[] = []
    prevIconSet?.forEach(
      (name) => {
        prevIconNames.push(name)
      },
      ['icon', 'variation'],
    )

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

    if (!prevIconNames) {
      consola.success(`${logPrefix} Initialize with ${iconSet.count()} icons`)
    } else {
      if (addedIconNames.length) {
        consola.success(
          `${logPrefix} Added icons:\n${addedIconNames.join('\n')}`,
        )
      }
      if (removedIconNames.length) {
        consola.warn(
          `${logPrefix} Removed icons:\n${removedIconNames.join('\n')}`,
        )
      }
      if (!addedIconNames.length && !removedIconNames.length) {
        consola.log(`${logPrefix} No icons changed`)
        continue
      }
    }

    fse.writeJsonSync(targetIconsJsonPath, iconSet.export())
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
  ${iconSet
    .list()
    .map((item) => {
      const svgStr = iconSet.toSVG(item)?.toString()
      return `<span title="${item}">${svgStr}</span>`
    })
    .join('')}
</body>
</html>
`,
    )
  }
}
