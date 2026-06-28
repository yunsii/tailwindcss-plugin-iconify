import type { IconcatPreset } from '@iconcat/extractor'

const DEFAULT_NEXT_PAGE_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx']
const SUPPORTED_NEXT_PAGE_LEAF_EXTENSIONS = new Set(DEFAULT_NEXT_PAGE_EXTENSIONS)

export interface NextPresetOptions {
  pageExtensions?: string[]
}

export function nextApp(options: NextPresetOptions = {}): IconcatPreset {
  const normalizedPageExtensions = normalizeNextPageExtensions(options.pageExtensions)
  const pageExtensions = formatGlobExtensions(normalizedPageExtensions)

  return {
    name: 'next-app',
    entries: [
      `app/**/page.${pageExtensions}`,
      `app/**/layout.${pageExtensions}`,
      `app/**/template.${pageExtensions}`,
      `src/app/**/page.${pageExtensions}`,
      `src/app/**/layout.${pageExtensions}`,
      `src/app/**/template.${pageExtensions}`,
    ],
    next: {
      pageExtensions: normalizedPageExtensions,
    },
  }
}

export function nextPages(options: NextPresetOptions = {}): IconcatPreset {
  const normalizedPageExtensions = normalizeNextPageExtensions(options.pageExtensions)
  const pageExtensions = formatGlobExtensions(normalizedPageExtensions)

  return {
    name: 'next-pages',
    entries: [
      `pages/**/*.${pageExtensions}`,
      `src/pages/**/*.${pageExtensions}`,
    ],
    exclude: [
      'pages/api/**',
      'src/pages/api/**',
    ],
    next: {
      pageExtensions: normalizedPageExtensions,
    },
  }
}

export function reactRouter(): IconcatPreset {
  return {
    name: 'react-router',
    entries: [
      'src/main.{js,jsx,ts,tsx}',
      'src/App.{js,jsx,ts,tsx}',
      'src/router.{js,jsx,ts,tsx}',
      'src/routes.{js,jsx,ts,tsx}',
      'app/routes/**/*.{js,jsx,ts,tsx,mdx}',
      'src/routes/**/*.{js,jsx,ts,tsx,mdx}',
    ],
  }
}

function normalizeNextPageExtensions(pageExtensions = DEFAULT_NEXT_PAGE_EXTENSIONS) {
  const normalized = [
    ...new Set(
      pageExtensions
        .map((extension) => extension.replace(/^\./, ''))
        .filter((extension) =>
          SUPPORTED_NEXT_PAGE_LEAF_EXTENSIONS.has(extension.split('.').at(-1) || '')),
    ),
  ]

  if (!normalized.length) {
    throw new Error('Iconcat Next presets require at least one js, jsx, ts, or tsx page extension.')
  }

  return normalized
}

function formatGlobExtensions(pageExtensions: string[]) {
  return pageExtensions.length === 1
    ? pageExtensions[0]
    : `{${pageExtensions.join(',')}}`
}
