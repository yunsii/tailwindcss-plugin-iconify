import consola from 'consola'

import { COLORED_POSTFIX } from '../../../../helpers/icon-set'

export interface ProcessNodeOptions {
  prefix: string
  preserveColorsGroup?: string
}

/**
 * Process Figma node to generate icon name
 * Support node type: 'FRAME' | 'COMPONENT' | 'INSTANCE'
 */
export function iconNameForNode(
  node: any,
  options: ProcessNodeOptions,
): string | undefined {
  const { prefix, preserveColorsGroup } = options

  if (!['COMPONENT', 'INSTANCE', 'FRAME'].includes(node.type)) {
    return
  }

  if (node.name.startsWith(`${prefix}-`)) {
    const nameRegExp = /^[a-z]([a-z0-9\-])*[a-z0-9]$/
    if (!nameRegExp.test(node.name)) {
      throw new Error(
        `Unexpected icon name: ${node.name}, regexp: ${nameRegExp}`,
      )
    }
    const newName = node.name.replace(`${prefix}-`, '')
    const unexpectedHyphensRegExp = /-{2,}/
    if (unexpectedHyphensRegExp.test(newName)) {
      throw new Error(
        `Unexpected icon name: ${node.name}, contains duplicate hyphens`,
      )
    }

    if (
      preserveColorsGroup
      && node.parents.some((item: any) => {
        return (
          ['FRAME', 'GROUP', 'SECTION'].includes(item.type)
          && item.name.trim() === preserveColorsGroup
        )
      })
    ) {
      consola.log('colored icon', node.name)
      return `${newName}${COLORED_POSTFIX}`
    }
    consola.log('icon', node.name)
    return newName
  }
}
