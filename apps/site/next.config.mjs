import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX({
  configPath: './source.config.ts',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@iconcat/adapter-utils',
    '@iconcat/core',
    '@iconcat/example-fixtures',
    '@iconcat/tailwind',
  ],
}

export default withMDX(nextConfig)
