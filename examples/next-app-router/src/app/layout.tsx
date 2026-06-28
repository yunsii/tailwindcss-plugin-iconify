import process from 'node:process'

import { IconcatAppRouterStylesheets } from '@iconcat/next/app-router'
import { defineIconcatIcons } from 'iconcat/runtime'

import './globals.css'

const iconcatManifest = process.env.ICONCAT_MANIFEST || '.iconcat/manifest.json'
const iconcatShellIcons = defineIconcatIcons([
  'mdi-light:home',
])

export default function Layout({ children }: { children: React.ReactNode }) {
  void iconcatShellIcons

  return (
    <html lang='en'>
      <head>
        <IconcatAppRouterStylesheets manifest={iconcatManifest} />
      </head>
      <body>{children}</body>
    </html>
  )
}
