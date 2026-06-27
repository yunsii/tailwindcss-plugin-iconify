import { matchIconName } from '@iconify/utils/lib/icon/name'

export type IconcatIconNameMap = Record<string, Set<string>>

export interface IconcatIconName {
  prefix: string
  name: string
}

type IconcatIconNameToken = IconcatIconName | 'partial'

export function parseIconName(input: string): IconcatIconName | undefined {
  const parsed = parseIconNameToken(input)
  return parsed === 'partial' ? undefined : parsed
}

function parseIconNameToken(input: string): IconcatIconNameToken | undefined {
  const icon = input.trim()
  if (!icon) {
    return
  }

  const colonParts = icon.split(':')
  if (colonParts.length === 2) {
    return createIconName(colonParts[0], colonParts[1])
  }

  const dynamicMatch = icon.match(/^([\w-]+)-\[([^\\\]]+)\]$/)
  if (dynamicMatch) {
    return parseDynamicIconValue(dynamicMatch[2])
  }

  const classParts = icon.replace(/^\./, '').split('--')
  if (classParts[0] === 'icon') {
    if (classParts.length === 3) {
      return createIconName(classParts[1], classParts[2])
    }
    if (classParts.length === 2) {
      return 'partial'
    }
  }
}

export function parseDynamicIconValue(input: string): IconcatIconName | undefined {
  const nameParts = input.split(/--|:/)
  if (nameParts.length !== 2) {
    return
  }

  return createIconName(nameParts[0], nameParts[1])
}

export function getIconNames(
  icons: string[] | string,
): IconcatIconNameMap | undefined {
  const prefixes = Object.create(null) as IconcatIconNameMap

  const add = (item: IconcatIconName) => {
    ;(prefixes[item.prefix] || (prefixes[item.prefix] = new Set())).add(
      item.name,
    )
  }

  const iconNames = Array.isArray(icons)
    ? icons.flatMap((item) => item.split(/[\s,.]/))
    : typeof icons === 'string'
      ? icons.split(/[\s,.]/)
      : undefined

  if (!iconNames?.length) {
    return
  }

  iconNames.forEach((icon) => {
    if (!icon.trim()) {
      return
    }

    const parsed = parseIconNameToken(icon)
    if (parsed && parsed !== 'partial') {
      add(parsed)
      return
    }
    if (parsed === 'partial') {
      return
    }

    throw new Error(`Cannot resolve icon: "${icon}"`)
  })

  return prefixes
}

export function iconNameMapToCatalogIcons(
  iconNames: IconcatIconNameMap | undefined,
) {
  return Object.fromEntries(
    Object.entries(iconNames || {}).map(([prefix, names]) => [
      prefix,
      Array.from(names).sort(),
    ]),
  )
}

function createIconName(
  prefix: string,
  name: string,
): IconcatIconName | undefined {
  if (prefix.match(matchIconName) && name.match(matchIconName)) {
    return { prefix, name }
  }
}
