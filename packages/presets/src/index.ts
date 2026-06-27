import type { IconcatPreset } from '@iconcat/extractor'

export function nextApp(): IconcatPreset {
  return {
    name: 'next-app',
    entries: [
      'app/**/page.{js,jsx,ts,tsx,mdx}',
      'app/**/layout.{js,jsx,ts,tsx,mdx}',
      'app/**/template.{js,jsx,ts,tsx,mdx}',
      'src/app/**/page.{js,jsx,ts,tsx,mdx}',
      'src/app/**/layout.{js,jsx,ts,tsx,mdx}',
      'src/app/**/template.{js,jsx,ts,tsx,mdx}',
    ],
  }
}

export function nextPages(): IconcatPreset {
  return {
    name: 'next-pages',
    entries: [
      'pages/**/*.{js,jsx,ts,tsx,mdx}',
      'src/pages/**/*.{js,jsx,ts,tsx,mdx}',
    ],
    exclude: [
      'pages/api/**',
      'src/pages/api/**',
    ],
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
