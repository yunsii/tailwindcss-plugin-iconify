import { getIconsCSSData } from '@iconify/utils/lib/css/icons'
import { matchIconName } from '@iconify/utils/lib/icon/name'

import { ensureLoadIconSet } from './loader'

import type { DynamicIconifyPluginOptions } from './options'

export function transformCSSDataToRules(
  data: ReturnType<typeof getIconsCSSData>,
  options: DynamicIconifyPluginOptions = {},
) {
  return {
    // Common rules
    ...(options.overrideOnly || !data.common?.rules ? {} : data.common.rules),

    // Icon rules
    ...data.css[0].rules,
  }
}

/**
 * Get dynamic CSS rules
 */
export function getDynamicCSSRules(
  icon: string,
  options: DynamicIconifyPluginOptions = {},
): Record<string, string> {
  const nameParts = icon.split(/--|\:/)
  if (nameParts.length !== 2) {
    throw new Error(`Invalid icon name: "${icon}"`)
  }

  const [prefix, name] = nameParts
  if (!(prefix.match(matchIconName) && name.match(matchIconName))) {
    throw new Error(`Invalid icon name: "${icon}"`)
  }

  const iconSet = ensureLoadIconSet(prefix, options)

  const generated = getIconsCSSData(iconSet, [name], {
    iconSelector: '.icon',
  })
  if (generated.css.length !== 1) {
    throw new Error(`Cannot find "${icon}". Bad icon name?`)
  }

  return transformCSSDataToRules(generated, options)
}
