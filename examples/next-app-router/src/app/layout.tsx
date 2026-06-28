import { IconcatAppRouterStylesheets } from '@iconcat/next/app-router'
import { defineIconcatIcons } from 'iconcat/runtime'

import './globals.css'

const iconcatShellIcons = defineIconcatIcons([
  'mdi-light:home',
])

export default function Layout({ children }: { children: React.ReactNode }) {
  void iconcatShellIcons

  return (
    <html lang='en'>
      <head>
        <IconcatAppRouterStylesheets />
      </head>
      <body>{children}</body>
    </html>
  )
}
