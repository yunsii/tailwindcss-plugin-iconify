import fse from 'fs-extra'
import pathe from 'pathe'

import type { IconSet } from '@iconify/tools'

import { logger } from '../helpers/logger'

import type { CalcWritableIconSetBaseOptions } from './writable-icon-set'

export interface WriteIconSetOptions extends Pick<CalcWritableIconSetBaseOptions, 'mode'> {
  prevIconSet: IconSet | null
  writeIconSet: IconSet
  addedIconNames: string[]
  removedIconNames: string[]
  targetIconsJsonDir: string
  targetIconsJsonPath: string
}

export function writeIconSet(options: WriteIconSetOptions): boolean {
  const { prevIconSet, writeIconSet, addedIconNames, removedIconNames, targetIconsJsonDir, targetIconsJsonPath, mode } = options
  const logPrefix = `[write-icon-set][${writeIconSet.prefix}]`

  if (!prevIconSet) {
    logger.success(
      `${logPrefix} Initialize with ${writeIconSet.count()} icons`,
    )
  } else {
    if (addedIconNames.length) {
      logger.success(
        `${logPrefix} Added icons:\n${addedIconNames.join(', ')}`,
      )
    }
    if (mode === 'full-update' && removedIconNames.length) {
      logger.warn(
        `${logPrefix} Removed icons:\n${removedIconNames.join(', ')}`,
      )
    }
    if (
      (mode === 'full-update'
        && !addedIconNames.length
        && !removedIconNames.length)
        || (mode === 'incremental-update' && !addedIconNames.length)
    ) {
      logger.log(`${logPrefix} No icons changed`)
      return false
    }
  }

  fse.writeJsonSync(targetIconsJsonPath, writeIconSet.export(), {
    spaces: 2,
  })

  const iconElements = writeIconSet
    .list(['icon', 'variation', 'alias'])
    .map((item) => {
      const svgStr = writeIconSet.toSVG(item)?.toString()
      return `<span title="${item}">${svgStr}</span>`
    })
    .join('\n')

  const htmlContent = [
    '<html>',
    '<style>',
    'svg {',
    '  width: 32px;',
    '  height: 32px;',
    '}',
    '',
    'svg:hover {',
    '  background: #ddd;',
    '  color: gray;',
    '}',
    '</style>',
    '<body>',
    `  ${iconElements}`,
    '</body>',
    '</html>',
  ].join('\n')

  fse.writeFileSync(
    pathe.join(targetIconsJsonDir, `icons.html`),
    htmlContent,
  )

  return true
}
