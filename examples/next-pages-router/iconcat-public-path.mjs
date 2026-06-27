import process from 'node:process'

export const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || ''

export const iconcatCSSPublicPath = joinPublicPath(
  assetPrefix,
  '/_next/static/css',
)

function joinPublicPath(prefix, path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!prefix) {
    return normalizedPath
  }

  return `${prefix.replace(/\/$/, '')}${normalizedPath}`
}
