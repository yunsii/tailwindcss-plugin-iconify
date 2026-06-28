import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX({
  configPath: './source.config.ts',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@iconcat/example-fixtures'],
}

export default withMDX(nextConfig)
