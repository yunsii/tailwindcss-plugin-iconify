import process from 'node:process'

import { icons } from '@iconcat/tailwind'

import type { Config } from 'tailwindcss'

const isProduction = process.env.NODE_ENV === 'production'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../fixtures/example-fixtures/src/**/*.{ts,tsx}'],
  plugins: isProduction ? [] : [icons()],
}

export default config
