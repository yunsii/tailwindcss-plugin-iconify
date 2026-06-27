import process from 'node:process'

import { createNextIconcatPublicPath } from '@iconcat/next'

export const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || ''

export const iconcatCSSPublicPath = createNextIconcatPublicPath({ assetPrefix })
