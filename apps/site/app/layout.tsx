import { generateIconcatCSS } from '@iconcat/tailwind/catalog-css'
import { RootProvider } from 'fumadocs-ui/provider/next'

import 'fumadocs-ui/style.css'
import 'fumadocs-ui/css/emerald.css'
import './styles.css'

const iconcatControlIconCSS = generateIconcatCSS({
  'mdi-light': [
    'fullscreen',
    'fullscreen-exit',
    'minus',
    'plus',
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
          dangerouslySetInnerHTML={{ __html: iconcatControlIconCSS }}
        />
      </head>
      <body>
        <RootProvider search={{ options: { api: '/api/search' } }}>{children}</RootProvider>
      </body>
    </html>
  )
}
