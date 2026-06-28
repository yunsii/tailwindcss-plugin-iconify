import { defineIconcatIcons } from 'iconcat/runtime'

import type { AppProps } from 'next/app'

import './globals.css'

const iconcatShellIcons = defineIconcatIcons([
  'mdi-light:home',
])

export default function App({ Component, pageProps }: AppProps) {
  void iconcatShellIcons
  return <Component {...pageProps} />
}
