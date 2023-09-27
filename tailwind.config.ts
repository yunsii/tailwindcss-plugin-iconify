import { addDynamicIconSelectors } from './src/plugin'
import { getLocalIconSets } from './src/extensions/local-icon-sets'

import type { Config } from 'tailwindcss'

const iconSets = getLocalIconSets({
  define: {
    custom: './assets',
  },
})
const preprocessSets = ['mdi', 'svg-spinners']

const config: Config = {
  content: ['./docs/**/*.tsx', './docs/**/*.mdx'],
  theme: {
    extend: {},
  },
  plugins: [
    addDynamicIconSelectors({
      // `it` abbr for `icon-specific-static`
      prefix: 'iss',
      iconSets,
      preprocessSets: {
        'mdi': ['home', 'arrow-collapse-right'],
        'svg-spinners': ['pulse-2'],
      },
    }),
    addDynamicIconSelectors({
      prefix: 'i',
      iconSets,
      preprocessSets,
    }),
    addDynamicIconSelectors({
      // `ih` abbr for `icon-hover`
      prefix: 'ih',
      iconSets,
      preprocessSets,
      overrideOnly: true,
    }),
  ],
}

export default config
