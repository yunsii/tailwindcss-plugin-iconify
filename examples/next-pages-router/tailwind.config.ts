import process from 'node:process'

import { icons } from '@iconcat/tailwind'

import type { Config } from 'tailwindcss'

const isProduction = process.env.NODE_ENV === 'production'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/example-fixtures/src/**/*.{ts,tsx}'],
  plugins: isProduction ? [] : [icons()],
}

export default config
