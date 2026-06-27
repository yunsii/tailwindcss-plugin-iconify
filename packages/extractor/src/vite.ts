import { writeIconCatalog } from './extract'

import type { IconcatConfig } from './config'

export function iconcat(config: IconcatConfig = {}) {
  return {
    name: 'iconcat',
    apply: 'build' as const,
    async buildStart() {
      await writeIconCatalog(config)
    },
  }
}
