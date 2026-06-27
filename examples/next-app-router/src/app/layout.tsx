import process from 'node:process'

import { getIconcatCSSHref } from '../iconcat-manifest'

import './globals.css'

function IconcatStylesheet({ href }: { href: string }) {
  const stylesheetProps = {
    href,
    precedence: 'next',
    rel: 'stylesheet',
  } as const

  return <link {...stylesheetProps} />
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const iconcatCSSHref = getIconcatCSSHref()

  return (
    <html lang='en'>
      <head>
        {process.env.NODE_ENV === 'production' && iconcatCSSHref
          ? <IconcatStylesheet href={iconcatCSSHref} />
          : null}
      </head>
      <body>{children}</body>
    </html>
  )
}
