import fse from 'fs-extra'
import pathe from 'pathe'

import type { IconSet } from '@iconify/tools'

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

    fse.writeJsonSync(
      pathe.join(composedOutputDir, `icons.json`),
      iconSet.export(),
    )
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
