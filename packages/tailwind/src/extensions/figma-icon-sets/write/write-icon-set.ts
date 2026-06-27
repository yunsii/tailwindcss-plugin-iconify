import fse from 'fs-extra'
import pathe from 'pathe'

import type { IconSet } from '@iconify/tools'

import type { CalcWritableIconSetBaseOptions } from './writable-icon-set'

export type WriteIconSetStatus = 'initialized' | 'updated' | 'unchanged'

export interface WriteIconSetOptions extends Pick<CalcWritableIconSetBaseOptions, 'mode'> {
  prevIconSet: IconSet | null
  writeIconSet: IconSet
  addedIconNames: string[]
  updatedIconNames: string[]
  removedIconNames: string[]
  targetIconsJsonDir: string
  targetIconsJsonPath: string
}

export interface WriteIconSetResult {
  prefix: string
  status: WriteIconSetStatus
  total: number
  addedIconNames: string[]
  updatedIconNames: string[]
  removedIconNames: string[]
}

export function writeIconSet(options: WriteIconSetOptions): WriteIconSetResult {
  const { prevIconSet, writeIconSet, addedIconNames, updatedIconNames, removedIconNames, targetIconsJsonDir, targetIconsJsonPath, mode } = options

  const result: Omit<WriteIconSetResult, 'status'> = {
    prefix: writeIconSet.prefix,
    total: writeIconSet.count(),
    addedIconNames,
    updatedIconNames,
    removedIconNames,
  }

  const unchanged
    = !!prevIconSet
      && !addedIconNames.length
      && !updatedIconNames.length
      && (mode === 'incremental-update' || !removedIconNames.length)

  if (unchanged) {
    return { ...result, status: 'unchanged' }
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

  return { ...result, status: prevIconSet ? 'updated' : 'initialized' }
}
