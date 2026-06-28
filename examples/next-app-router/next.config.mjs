import process from 'node:process'

const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || ''

const config = {
  transpilePackages: ['@iconcat/example-fixtures'],
}

if (assetPrefix) {
  config.assetPrefix = assetPrefix
}

export default config
