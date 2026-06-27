import process from 'node:process'

import Document, {
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document'

import { getIconcatCSSHref } from '../iconcat-manifest'

class IconcatHead extends Head {
  getCssLinks(files: Parameters<Head['getCssLinks']>[0]) {
    const cssLinks = super.getCssLinks(files)
    const iconcatCSSHref = getIconcatCSSHref()

    if (process.env.NODE_ENV !== 'production' || !iconcatCSSHref) {
      return cssLinks
    }

    return [
      ...(cssLinks || []),
      <link
        as='style'
        href={iconcatCSSHref}
        key='iconcat-preload'
        rel='preload'
      />,
      <link
        href={iconcatCSSHref}
        key='iconcat-stylesheet'
        rel='stylesheet'
      />,
    ]
  }
}

export default class AppDocument extends Document {
  render() {
    return (
      <Html>
        <IconcatHead />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
