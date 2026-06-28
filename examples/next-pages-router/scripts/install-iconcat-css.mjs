import process from 'node:process'

import { installNextIconcatCSS } from '@iconcat/next'

await installNextIconcatCSS({
  manifest: process.env.ICONCAT_MANIFEST || '.iconcat/manifest.json',
  sourceDir: process.env.ICONCAT_SOURCE_DIR || '.iconcat',
})
