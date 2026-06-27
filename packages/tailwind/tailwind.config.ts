import type { Config } from 'tailwindcss'

import { getLocalIconSets } from './src/extensions/local-icon-sets'
import { icons } from './src/plugin'

const iconSets = getLocalIconSets({
  define: {
    custom: './assets',
  },
})
const staticIconSets = ['mdi', 'svg-spinners']

const config: Config = {
  content: ['./docs/**/*.tsx', './docs/**/*.mdx'],
  theme: {
    extend: {},
  },
  plugins: [
    icons({
      // `iss` abbr for `icon-specific-static`
      prefix: 'iss',
      iconSets,
      static: {
        'mdi': ['home', 'arrow-collapse-right'],
        'svg-spinners': ['pulse-2'],
      },
    }),
    icons({
      prefix: 'i',
      iconSets,
      static: staticIconSets,
    }),
    icons({
      // `ih` abbr for `icon-hover`
      prefix: 'ih',
      iconSets,
      static: staticIconSets,
      overrideOnly: true,
    }),
  ],
}

export default config
