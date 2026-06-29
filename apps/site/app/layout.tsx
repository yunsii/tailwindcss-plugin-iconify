import { generateIconcatCSS } from '@iconcat/tailwind/catalog-css'
import { RootProvider } from 'fumadocs-ui/provider/next'

import 'fumadocs-ui/style.css'
import 'fumadocs-ui/css/emerald.css'
import './styles.css'

const iconcatIconCSS = generateIconcatCSS({
  'line-md': [
    'cloud',
    'download',
    'github',
    'home',
    'search',
    'speedometer',
  ],
  'mdi': [
    'cloud',
    'database',
    'github',
    'layers',
    'rocket',
    'sitemap',
  ],
  'mdi-light': [
    'fullscreen',
    'fullscreen-exit',
    'minus',
    'plus',
  ],
  'svg-spinners': [
    '3-dots-bounce',
    'bars-scale',
    'blocks-wave',
    'clock',
    'pulse-rings-3',
    'wifi',
  ],
})

export const metadata = {
  title: 'Iconcat',
  description: 'Entry-driven icon catalog extractor.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <style
          data-iconcat-icons=''
          dangerouslySetInnerHTML={{ __html: iconcatIconCSS }}
        />
      </head>
      <body>
        <RootProvider search={{ options: { api: '/api/search' } }}>{children}</RootProvider>
      </body>
    </html>
  )
}
