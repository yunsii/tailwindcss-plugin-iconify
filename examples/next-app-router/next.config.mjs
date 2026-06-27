import { assetPrefix } from './iconcat-public-path.mjs'

const config = {
  transpilePackages: ['@iconcat/example-fixtures'],
}

if (assetPrefix) {
  config.assetPrefix = assetPrefix
}

export default config
