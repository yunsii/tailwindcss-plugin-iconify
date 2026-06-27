import { getAppRouterIconcatStylesheetProps } from '@iconcat/next'

import './globals.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  const iconcatStylesheetProps = getAppRouterIconcatStylesheetProps()

  return (
    <html lang='en'>
      <head>
        {iconcatStylesheetProps ? <link {...iconcatStylesheetProps} /> : null}
      </head>
      <body>{children}</body>
    </html>
  )
}
