import consola from 'consola'

const EXTENSION_ABBR = 'fis'

export const logger = consola.withTag(EXTENSION_ABBR).withDefaults({
  /** ref: https://github.com/unjs/consola#log-level */
  level: 3,
})
