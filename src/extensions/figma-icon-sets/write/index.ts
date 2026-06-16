import type { IconSet } from '@iconify/tools'

import { logger } from '../helpers/logger'
import { renderTable } from '../helpers/render-table'
import { calcWritableIconSet } from './writable-icon-set'
import { writeIconSet } from './write-icon-set'

import type { CalcWritableIconSetBaseOptions } from './writable-icon-set'
import type { WriteIconSetResult, WriteIconSetStatus } from './write-icon-set'

export interface WriteIconifyJSONsOptions extends CalcWritableIconSetBaseOptions {
  afterWrite?: (iconSets: IconSet[]) => void
}

const STATUS_LABEL: Record<WriteIconSetStatus, string> = {
  initialized: 'initialized',
  updated: 'updated',
  unchanged: 'unchanged',
}

export function writeIconifyJSONs(
  iconSets: IconSet[],
  options: WriteIconifyJSONsOptions,
) {
  const { mode = 'incremental-update', outputDir, afterWrite } = options

  const writableIconSets = iconSets.map((iconSet) => {
    return calcWritableIconSet({ iconSet, outputDir, mode })
  })

  const results = writableIconSets.map((writableIconSetData) => {
    return writeIconSet({ ...writableIconSetData, mode })
  })

  printWriteSummary(results, mode)

  afterWrite?.(writableIconSets.map((item) => item.writeIconSet))
}

function printWriteSummary(
  results: WriteIconSetResult[],
  mode: NonNullable<CalcWritableIconSetBaseOptions['mode']>,
) {
  if (!results.length) {
    logger.info('No icon sets to write.')
    return
  }

  const table = renderTable(
    ['Prefix', 'Status', 'Total', 'Added', 'Removed'],
    results.map((result) => [
      result.prefix,
      STATUS_LABEL[result.status],
      String(result.total),
      result.addedIconNames.length ? `+${result.addedIconNames.length}` : '0',
      result.removedIconNames.length ? `-${result.removedIconNames.length}` : '0',
    ]),
  )

  logger.log(`Icon sets write summary (mode: ${mode})\n${table}`)

  // Detailed list of newly added icons, kept separate from the table so long
  // name lists do not break column alignment.
  for (const result of results) {
    if (result.addedIconNames.length) {
      logger.success(
        `[${result.prefix}] +${result.addedIconNames.length} added: ${result.addedIconNames.join(', ')}`,
      )
    }
  }

  // Deletion is destructive (only reachable in full-update mode), so surface it
  // prominently in a boxed warning instead of a normal log line.
  const deletions = results.filter((result) => result.removedIconNames.length)
  if (deletions.length) {
    const removedTotal = deletions.reduce(
      (total, result) => total + result.removedIconNames.length,
      0,
    )
    const message = [
      `${removedTotal} icon(s) removed in full-update mode:`,
      '',
      ...deletions.map((result) => {
        return `• [${result.prefix}] -${result.removedIconNames.length}: ${result.removedIconNames.join(', ')}`
      }),
    ].join('\n')

    logger.box({
      title: '⚠️  ICONS DELETED',
      message,
      style: {
        borderColor: 'red',
        borderStyle: 'double',
      },
    })
  }
}
